import docker
import base64
import asyncio
from enum import Enum
from typing import List
from docker.errors import DockerException, ContainerError, APIError
from requests.exceptions import ReadTimeout
from workflow.util import Language
from pydantic import BaseModel, Field

class ExecutionType(str, Enum):
    """Defines how the code should be executed in the container"""
    PYTHON = "python"      # Execute as Python code
    SHELL = "shell"        # Execute as shell script
    SHELL_DEPS = "deps"    # Execute as shell script for dependencies

class CodeBlock(BaseModel):
    """Represents a block of code to be executed"""
    code: str = Field(..., description="The code to be executed")
    execution_type: ExecutionType = Field(..., description="How the code should be executed")
    language: Language = Field(..., description="Programming language of the code")
    dependencies: bool = Field(default=False, description="Indicates if this block installs dependencies")

class CodeExecutionResult(BaseModel):
    """Results from a code execution"""
    logs: str = Field(..., description="Execution logs")
    exit_code: int = Field(..., description="Exit code from execution")
    execution_type: ExecutionType = Field(..., description="Type of execution performed")

class RunCodeError(Exception):
    """Custom exception for code execution errors"""
    def __init__(self, message: str, exit_code: int, logs: str):
        self.message = message
        self.exit_code = exit_code
        self.logs = logs
        super().__init__(self.message)

class RunCode(BaseModel):
    """
    Handles code execution in Docker containers with support for dependencies and multiple languages.
    
    Features:
    - Manages Docker container lifecycle
    - Handles different execution types (Python, Shell)
    - Supports dependency installation
    - Provides retry mechanisms
    - Maintains execution order for dependencies
    """
    
    timeout: int = Field(default=30, description="Timeout in seconds for code execution")
    retries: int = Field(default=3, description="Number of retry attempts for failed executions")
    log_level: str = Field(default='info', description="Logging level")
    
    # These can't be in the model's fields because they're not serializable
    class Config:
        arbitrary_types_allowed = True
    
    def __init__(self, **data):
        super().__init__(**data)
        self.client = docker.from_env()
        self.images = {
            Language.PYTHON: ['mypython:latest'],
            Language.SHELL: ['mybash:latest']
        }
    
    def _encode_code(self, code: str) -> str:
        """Encode code in base64 for secure transfer to container"""
        code = code.replace('\r\n', '\n').replace('\r', '\n')
        return base64.b64encode(code.encode('utf-8')).decode('utf-8')
    
    def _get_execution_command(self, code_block: CodeBlock, code_b64: str) -> str:
        """Generate the appropriate execution command based on execution type"""
        if code_block.execution_type == ExecutionType.PYTHON:
            return 'python -c "import base64; exec(base64.b64decode(\'$CODE_B64\').decode())"'
        elif code_block.execution_type in [ExecutionType.SHELL, ExecutionType.SHELL_DEPS]:
            return 'bash -c "$(echo $CODE_B64 | base64 -d)"'
        else:
            raise ValueError(f"Unsupported execution type: {code_block.execution_type}")
    
    def _get_container_image(self, code_block: CodeBlock) -> str:
        """Determine the appropriate container image based on execution type"""
        if code_block.execution_type == ExecutionType.PYTHON:
            return self.images[Language.PYTHON][0]
        elif code_block.execution_type == ExecutionType.SHELL_DEPS:
            # Dependencies always run in Python container
            return self.images[Language.PYTHON][0]
        elif code_block.execution_type == ExecutionType.SHELL:
            return self.images[Language.SHELL][0]
        else:
            raise ValueError(f"Unsupported execution type: {code_block.execution_type}")
    
    def _analyze_code_blocks(self, code_blocks: List[CodeBlock]) -> List[CodeBlock]:
        """
        Analyze code blocks to determine execution order and dependencies.
        Returns blocks in the order they should be executed.
        """
        dependency_blocks = []
        regular_blocks = []
        
        for block in code_blocks:
            if block.dependencies:
                dependency_blocks.append(block)
            else:
                regular_blocks.append(block)
                
        return dependency_blocks + regular_blocks
    
    def detect_block_type(self, code: str, language: Language) -> CodeBlock:
        """
        Analyze code to determine its execution type and dependencies.
        """
        if language == Language.PYTHON:
            return CodeBlock(
                code=code,
                execution_type=ExecutionType.PYTHON,
                language=language
            )
        elif language == Language.SHELL:
            # Check if this is a dependency installation block
            if "pip install" in code:
                return CodeBlock(
                    code=code,
                    execution_type=ExecutionType.SHELL_DEPS,
                    language=language,
                    dependencies=True
                )
            return CodeBlock(
                code=code,
                execution_type=ExecutionType.SHELL,
                language=language
            )
        else:
            raise ValueError(f"Unsupported language: {language}")

    async def execute_code(self, code_blocks: List[CodeBlock]) -> List[CodeExecutionResult]:
        """
        Execute multiple code blocks in the correct order, handling dependencies.
        
        Args:
            code_blocks: List of CodeBlock objects to execute
            
        Returns:
            List of CodeExecutionResult objects containing execution results
            
        Raises:
            RunCodeError: If code execution fails
        """
        ordered_blocks = self._analyze_code_blocks(code_blocks)
        results: List[CodeExecutionResult] = []
        
        for block in ordered_blocks:
            try:
                result = await self._execute_single_block(block)
                results.append(result)
                
                if result.exit_code != 0 and not block.dependencies:
                    # Non-dependency failures are fatal
                    raise RunCodeError(
                        f"Execution failed for {block.execution_type.value}",
                        result.exit_code,
                        result.logs
                    )
                    
            except RunCodeError as e:
                if not block.dependencies:  # Non-dependency failures are fatal
                    raise
                # Add the failed dependency result but continue
                results.append(CodeExecutionResult(
                    logs=e.logs,
                    exit_code=e.exit_code,
                    execution_type=block.execution_type
                ))
                
        return results

    async def _execute_single_block(self, code_block: CodeBlock) -> CodeExecutionResult:
        """Execute a single code block with retries"""
        last_error = None
        code_b64 = self._encode_code(code_block.code)
        
        for attempt in range(self.retries):
            try:
                command = self._get_execution_command(code_block, code_b64)
                image = self._get_container_image(code_block)
                
                container = self.client.containers.run(
                    image,
                    ['bash', '-c', command],
                    detach=True,
                    stdout=True,
                    stderr=True,
                    network_disabled=False,
                    mem_limit='512m',
                    cpu_quota=50000,
                    environment={'CODE_B64': code_b64}
                )
                
                try:
                    exit_status = container.wait(timeout=self.timeout)
                    logs = container.logs(stdout=True, stderr=True).decode('utf-8')
                    container.remove()
                    
                    if exit_status['StatusCode'] != 0:
                        raise RunCodeError(
                            f"Execution failed with status {exit_status['StatusCode']}",
                            exit_status['StatusCode'],
                            logs
                        )
                    
                    return CodeExecutionResult(
                        logs=logs,
                        exit_code=exit_status['StatusCode'],
                        execution_type=code_block.execution_type
                    )
                    
                except ReadTimeout:
                    container.kill()
                    raise RunCodeError(
                        f"Execution exceeded {self.timeout} seconds",
                        -1,
                        "Timeout"
                    )
                    
            except (ContainerError, DockerException, APIError) as e:
                last_error = RunCodeError(str(e), -1, str(e))
                if attempt < self.retries - 1:  # Don't sleep on last attempt
                    await asyncio.sleep(1)
                continue
                
        if last_error:
            raise last_error
        
        raise RunCodeError("Unknown error during execution", -1, "Unknown error")