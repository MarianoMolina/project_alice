from abc import abstractmethod
from pydantic import BaseModel, Field
from workflow.core.data_structures import References, ApiType, FunctionParameters
from typing import Dict, Any, Optional
from workflow.util import sanitize_and_limit_string

class APIEngine(BaseModel):
    """
    Abstract base class defining the interface for API interactions in the workflow system.
    
    APIEngine provides a standardized way to interact with various external APIs, handling
    both AI models (LLM, Vision, etc.) and services (Search, Knowledge Graph, etc.). Each
    specific API implementation inherits from this class and implements its interface.
    
    The engine serves as a bridge between the raw API and the workflow system by:
    1. Defining expected input parameters through FunctionParameters
    2. Converting API responses into standardized References objects
    3. Handling file generation and management when needed
    4. Providing consistent error handling and validation
    
    Key Components:
    - Input validation through FunctionParameters
    - Standardized response formatting via References
    - Consistent file handling and naming
    - Error handling and logging
    
    Attributes:
        input_variables (FunctionParameters): Schema defining expected inputs
        required_api (ApiType): The type of API this engine implements
    
    Example:
        ```python
        class LLMEngine(APIEngine):
            input_variables = FunctionParameters(
                type="object",
                properties={
                    "messages": ParameterDefinition(
                        type="array",
                        description="List of conversation messages"
                    ),
                    "temperature": ParameterDefinition(
                        type="number",
                        description="Sampling temperature",
                        default=0.7
                    )
                },
                required=["messages"]
            )
            required_api = ApiType.LLM_MODEL
        ```
    """
    input_variables: FunctionParameters = Field(..., description="This inputs this API engine takes: requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
    required_api: ApiType = Field(..., title="The API engine required")

    @abstractmethod
    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> References:
        """
        Generate a response from the API based on provided data and parameters.
        
        This is the main method that must be implemented by all APIEngine subclasses.
        It handles the actual API interaction and converts the response into the
        workflow system's format.
        
        Args:
            api_data: API configuration data (keys, endpoints, etc.)
            **kwargs: Additional parameters as defined in input_variables
        
        Returns:
            References object containing the API response in appropriate format
        
        Notes:
            - Response format depends on the API type:
                * LLM APIs return messages
                * Vision APIs return image analysis
                * Search APIs return structured data
                * File generation APIs return file references
            - All responses must be wrapped in a References object
            - Error handling should be consistent across implementations
        """
        pass

    def generate_filename(self, prompt: str, model: Optional[str], index: Optional[int], extension: str = 'png') -> str:
        """
        Generate a standardized filename for API-generated files.
        
        Creates consistent, safe filenames for any files generated through the API,
        such as images or audio files. Handles sanitization and length limits.
        
        Args:
            prompt: Input prompt or description for the file
            model: Optional model identifier
            index: Optional index for multiple files
            extension: File extension (default: 'png')
        
        Returns:
            Sanitized filename string
        
        Notes:
            - Filenames are truncated to safe lengths
            - Special characters are removed or replaced
            - Timestamps or indices can be added for uniqueness
            - Used primarily by file-generating APIs (image, speech, etc.)
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