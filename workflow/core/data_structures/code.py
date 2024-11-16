from typing import Optional
from pydantic import BaseModel, Field
from workflow.core.data_structures.base_models import Embeddable
from workflow.util import Language

class CodeBlock(BaseModel):
    """CodeBlock is a container for code snippets."""
    code: str = Field(..., description="The code snippet")
    language: Language = Field(..., description="The programming language used for the code")

    def __str__(self) -> str:
        return f"Language: {self.language.value}, Code:\n{self.code}"

class CodeOutput(BaseModel):
    """CodeOutput is a container for code output details."""
    output: str = Field(..., description="The output of the code execution")
    exit_code: int = Field(..., description="The exit code of the code execution")

    def __str__(self) -> str:
        return f"Output:\n{self.output}\nExit Code: {self.exit_code}"

class CodeExecution(Embeddable):
    """CodeExecution is a container for code execution details."""
    code_block: CodeBlock = Field(..., description="The code block to be executed")
    code_output: Optional[CodeOutput] = Field(None, description="The output of the code execution")

    def __str__(self) -> str:
        return f"{self.code_block}\n{self.code_output}" if self.code_output else str(self.code_block)