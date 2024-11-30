from typing import Dict, List
from pydantic import Field
from workflow.core.data_structures import BaseDataStructure, ApiName, ApiType, API_CONFIG_TYPES, API_CAPABILITIES
from workflow.core.data_structures.api_utils import NoConfig

class APIConfig(BaseDataStructure):
    """
    Configuration container for API credentials and settings.
    
    APIConfig handles the validation and storage of API-specific configuration data,
    ensuring that all required fields for a given API type are present and properly
    formatted. It also tracks the health status of the API configuration.
    
    The configuration requirements are determined by the API_CONFIG_TYPES mapping,
    which specifies the required fields for each ApiName. Some APIs (marked with
    NoConfig) don't require any configuration.
    
    Key Features:
    - Automatic validation of required fields
    - Health status tracking
    - Support for custom API configurations
    - Type-specific configuration validation
    
    Attributes:
        name (str): Identifier for this configuration
        api_name (ApiName): The API this configuration is for
        data (Dict): Configuration data (keys, URLs, etc.)
        health_status (str): Current health status ("healthy", "unhealthy", "unknown")
    
    Example:
        ```python
        # OpenAI API configuration
        openai_config = APIConfig(
            name="openai-standard",
            api_name=ApiName.OPENAI,
            data={
                "api_key": "your-key",
                "base_url": "https://api.openai.com/v1"
            }
        )
        
        # Configuration for API without requirements
        wiki_config = APIConfig(
            name="wikipedia",
            api_name=ApiName.WIKIPEDIA,
            data={}  # No configuration required
        )
        ```
    
    Notes:
        - Configuration requirements are defined in API_CONFIG_TYPES
        - Some APIs (NoConfig) don't require configuration
        - Health status is used for runtime API availability checking
    """
    name: str
    api_name: ApiName
    data: Dict = Field(default_factory=dict)
    health_status: str = Field("unknown", pattern="^(healthy|unhealthy|unknown)$")
    
    def validate_config(self) -> bool:
        """
        Validates that the data dictionary contains all required fields for the given api_name
        """
        config_type = API_CONFIG_TYPES[self.api_name]
        # Handle APIs that don't require configuration
        if config_type is NoConfig:
            return True
        required_fields = config_type.__annotations__.keys()
        return all(field in self.data for field in required_fields)
    
    def get_supported_types(self) -> List[ApiType]:
        """
        Returns list of ApiTypes supported by this API configuration
        """
        return list(API_CAPABILITIES.get(self.api_name, set()))