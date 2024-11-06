from __future__ import annotations
from typing import Optional, Dict, TYPE_CHECKING, Union
from pydantic import Field, field_validator, BaseModel
from workflow.core.data_structures.central_types import ReferencesType

if TYPE_CHECKING:
    from workflow.core.data_structures.references import References

def get_default_references():
    from workflow.core.data_structures.references import References
    return References()

class ExecutionHistoryItem(BaseModel):
    parent_task_id: Optional[str] = Field(None, description="The id of the task parent to this node")
    node_name: str = Field(..., description="The name of the node. If the task has no inner nodes, the node_name is set to 'default'")
    execution_order: int = Field(..., description="The order in which the node was executed, with 0 being the first node")
    exit_code: Optional[int] = Field(None, description="The exit code of the node. Usually 0 means success")

class NodeResponse(ExecutionHistoryItem):
    references: ReferencesType = Field(default_factory=get_default_references, description="References associated with this node")

    @field_validator('references')
    @classmethod
    def validate_references(cls, value: Union[Dict, References]) -> References:
        from workflow.core.data_structures.references import References
        if isinstance(value, References):
            return value
        if isinstance(value, dict):
            return References(**value)
        return get_default_references()

    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if self.references:
            if isinstance(self.references, dict):
                from workflow.core.data_structures.references import References
                data['references'] = References(**self.references).model_dump(*args, **kwargs)
            else:
                data['references'] = self.references.model_dump(*args, **kwargs)
        return data