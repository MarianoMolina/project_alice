from abc import abstractmethod
from pydantic import BaseModel, Field
from workflow_logic.core.data_structures import References, ApiType
from workflow_logic.core.parameters import FunctionParameters
from typing import Dict, Any

class APIEngine(BaseModel):
    """
    Base class for API engines used in the workflow system.

    This abstract class defines the structure for API engines, which are responsible
    for interacting with various external APIs and returning standardized results.

    Attributes:
        input_variables (FunctionParameters): Defines the expected input structure for the API engine.
        required_api (ApiType): Specifies the type of API required for this engine.

    Note:
        Subclasses must implement the generate_api_response method.
    """

    input_variables: FunctionParameters = Field(..., description="This inputs this API engine takes: requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
    required_api: ApiType = Field(..., title="The API engine required")

    @abstractmethod
    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> References:
        """
        Generate an API response based on the provided data and parameters.

        This method must be implemented by subclasses to handle specific API interactions.

        Args:
            api_data (Dict[str, Any]): Configuration data for the API (e.g., API keys, endpoints).
            **kwargs: Additional parameters specific to the API being used.

        Returns:
            Union[SearchOutput, MessageDict]: The response from the API, either as search results or a message.

        Raises:
            NotImplementedError: If the method is not implemented by a subclass.
        """
        pass