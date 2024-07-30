from abc import abstractmethod
from pydantic import BaseModel, Field
from workflow_logic.core.communication import SearchOutput, MessageDict
from workflow_logic.core.api import ApiType
from workflow_logic.core.parameters import FunctionParameters
from typing import Dict, Any, Union

class APIEngine(BaseModel):
    input_variables: FunctionParameters = Field(..., description="This inputs this API engine takes: requires a prompt input, and optional inputs such as sort, time_filter, subreddit, and limit. Default is 'hot', 'week', 'all', and 10.")
    required_api: ApiType = Field(..., title="The API engine required")

    @abstractmethod
    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> Union[SearchOutput, MessageDict]:
        """Generates the API response for the task, using the provided API data."""
        pass