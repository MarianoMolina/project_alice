from abc import abstractmethod
from pydantic import BaseModel, Field
from workflow.core.data_structures import References, ApiType, FunctionParameters
from typing import Dict, Any, Optional
from workflow.util import sanitize_and_limit_string

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

    def generate_filename(self, prompt: str, model: Optional[str], index: Optional[int], extension: str = 'png') -> str:
        """
        Generate a descriptive filename based on the prompt and model.
        Sanitizes both prompt and model strings to ensure safe filenames.
        
        Args:
            prompt (str): The input prompt to use in filename
            model (str): The model identifier to use in filename
            index (int): Index number for the file
            extension (str): The file extension to use (default: 'png')
            
        Returns:
            str: A sanitized filename string
        """
        # Sanitize both prompt and model strings
        sanitized_prompt = sanitize_and_limit_string(prompt, 70)
        sanitized_model = sanitize_and_limit_string(model)
        
        # Construct the filename with truncated prompt
        filename = f"{sanitized_prompt}"
        if sanitized_model:
            filename += f"_{sanitized_model}"
        if index is not None:
            filename += f"_{index}"
        filename += f".{extension}"
        
        return filename