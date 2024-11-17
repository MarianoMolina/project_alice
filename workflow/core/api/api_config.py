from typing import Dict, List
from pydantic import Field
from workflow.core.data_structures import BaseDataStructure, ApiName, ApiType, API_CONFIG_TYPES, API_CAPABILITIES
from workflow.core.data_structures.api_utils import NoConfig

class APIConfig(BaseDataStructure):
    """
    Configuration class for APIs that validates the data structure based on the API provider
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