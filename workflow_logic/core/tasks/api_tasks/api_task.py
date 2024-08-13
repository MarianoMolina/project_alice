from typing import List, Type
from pydantic import Field, model_validator
from workflow_logic.core.api import APIManager, APIEngine, WikipediaSearchAPI, GoogleSearchAPI, ExaSearchAPI, ArxivSearchAPI, RedditSearchAPI
from workflow_logic.util import TaskResponse, ApiType
from workflow_logic.core.tasks.task import AliceTask

class APITask(AliceTask):
    """
    Represents a task that interacts with a specific API.

    This class is designed to handle tasks that require interaction with external APIs.
    It validates the API configuration and uses the appropriate API engine for execution.

    Attributes:
        required_apis (List[ApiType]): List containing exactly one ApiType, specifying the required API.
        api_engine (Type[APIEngine]): The class of the API engine to be used.

    Class Methods:
        validate_api_task: Validates the API task configuration.

    Methods:
        run: Execute the API task and return a TaskResponse.

    Raises:
        ValueError: If the API configuration is invalid or if required parameters are missing.
    """
    required_apis: List[ApiType] = Field(..., min_length=1, max_length=1)
    api_engine: Type[APIEngine] = Field(None)

    @model_validator(mode='after')
    def validate_api_task(cls, values):
        """
        Validate the API task configuration.

        This method ensures that:
        1. Exactly one API is specified.
        2. The specified API type is valid and not LLM_MODEL.
        3. An appropriate API engine class exists for the specified API type.
        4. The task's input variables are consistent with the API engine's requirements.

        Args:
            values: The attribute values to validate.

        Returns:
            dict: The validated values.

        Raises:
            ValueError: If any validation check fails.
        """
        # Validate that there's exactly one required API
        required_apis = values.required_apis
        if len(required_apis) != 1:
            raise ValueError("APITask must have exactly one required API")

        # Validate that the API type is valid and not LLM_MODEL
        api_type = required_apis[0]
        if api_type not in ApiType.__members__.values() or api_type == ApiType.LLM_MODEL:
            raise ValueError(f"{api_type} is not a valid API type for APITask")

        # Map API types to their corresponding engine classes
        api_engine_map = {
            ApiType.WIKIPEDIA_SEARCH: WikipediaSearchAPI,
            ApiType.GOOGLE_SEARCH: GoogleSearchAPI,
            ApiType.EXA_SEARCH: ExaSearchAPI,
            ApiType.ARXIV_SEARCH: ArxivSearchAPI,
            ApiType.REDDIT_SEARCH: RedditSearchAPI,
        }

        # Get the correct API engine class
        api_engine_class = api_engine_map.get(api_type)
        if api_engine_class is None:
            raise ValueError(f"No API engine class found for {api_type}")

        # Instantiate the API engine to access its input_variables
        api_engine_instance = api_engine_class()

        # Validate that the task's input variables are consistent with the API engine's requirements
        task_inputs = values.input_variables
        engine_inputs = api_engine_instance.input_variables

        for required_param in engine_inputs.required:
            if required_param not in task_inputs.properties:
                raise ValueError(f"Required parameter '{required_param}' from API engine not found in task inputs")

        values.api_engine = api_engine_class
        return values

    async def run(self, api_manager: APIManager, **kwargs) -> TaskResponse:
        """
        Execute the API task and return a TaskResponse.

        This method retrieves the necessary API data, instantiates the appropriate
        API engine, and executes the API request. It handles both successful
        executions and errors, wrapping the result in a TaskResponse.

        Args:
            api_manager (APIManager): The API manager to use for retrieving API data.
            **kwargs: Additional keyword arguments to pass to the API engine.

        Returns:
            TaskResponse: A response object containing the results of the API task execution.
        """
        task_inputs = kwargs.copy()
        try:
            api_data = api_manager.retrieve_api_data(self.required_apis[0])
            # if not api_data:
            #     raise ValueError(f"API data not found for {self.required_apis[0]}")
            api_engine = self.api_engine()  # Instantiate the API engine
            task_outputs = await api_engine.generate_api_response(api_data=api_data, **kwargs)
            return TaskResponse(
                task_id=self.id if self.id else '',
                task_name=self.task_name,
                task_description=self.task_description,
                status="complete",
                result_code=0,
                task_outputs=str(task_outputs),
                task_content=task_outputs,
                task_inputs=task_inputs,
                result_diagnostic="",
                execution_history=kwargs.get("execution_history", [])
            )
        except Exception as e:
            import traceback
            return TaskResponse(
                task_id=self.id if self.id else '',
                task_name=self.task_name,
                task_description=self.task_description,
                status="failed",
                task_inputs=task_inputs,
                result_code=1,
                result_diagnostic=str(f'Error: {e}\nTraceback: {traceback.format_exc()}'),
                execution_history=kwargs.get("execution_history", [])
            )