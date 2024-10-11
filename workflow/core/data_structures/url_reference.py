from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import Field, model_validator
from workflow.core.data_structures.base_models import BaseDataStructure

class URLReference(BaseDataStructure):
    id: Optional[str] = Field(None, description="The id of the search result", alias="_id")
    title: str = Field(..., description="The title of the search result")
    url: str = Field(..., description="The URL of the search result")
    content: str = Field(..., description="The content of the search result")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata associated with the search result")

    @model_validator(mode='before')
    def sanitize_metadata(cls, values):
        sanitized_metadata = {}
        metadata = values.get('metadata', {})
        for key, val in metadata.items():
            try:
                if isinstance(val, datetime):
                    sanitized_metadata[key] = val.isoformat()
                else:
                    sanitized_metadata[key] = str(val)
            except Exception as e:
                print(f"Error serializing value for key {key}: {val}, Exception: {e}")
                sanitized_metadata[key] = "Unserializable value"
        values['metadata'] = sanitized_metadata
        return values
    
    def __str__(self) -> str:
        return f"Title: {self.title} \nURL: {self.url} \n Content: {self.content}\n"