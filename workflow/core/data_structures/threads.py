from typing import Optional, List
from pydantic import Field
from workflow.core.data_structures.message import MessageDict
from workflow.core.data_structures.base_models import BaseDataStructure

class ChatThread(BaseDataStructure):
    name: Optional[str] = Field(None, description="The name of the chat thread")
    messages: List[MessageDict] = Field(default_factory=list, description="A list of messages in the chat thread")
    
    def __str__(self) -> str:
        messages = "\n".join([str(msg) for msg in self.messages])
        return f"{self.name if self.name else 'Unnamed Chat Thread'}:\n\n{messages}"
    
    def model_dump(self, *args, **kwargs):
        data = super().model_dump(*args, **kwargs)
        if self.messages:
            if isinstance(self.messages[0], dict):
                data['messages'] = [MessageDict(**msg).model_dump(*args, **kwargs) for msg in self.messages]
            else:
                data['messages'] = [msg.model_dump(*args, **kwargs) for msg in self.messages]
        return data