from typing import Union, Dict, Any
from workflow_logic.core.chat import AliceChat
from workflow_logic.core.tasks import AliceTask
from workflow_logic.core.api.api_manager import APIManager
# Utility function for deep API availability check
async def deep_api_check(item: Union[AliceTask, AliceChat], api_manager: APIManager) -> Dict[str, Any]:
    if isinstance(item, AliceTask) or isinstance(item, AliceChat):
        return item.deep_validate_required_apis(api_manager)
    else:
        raise ValueError(f"Unsupported item type for API check: {type(item)}")