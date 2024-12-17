from pydantic import BaseModel, Field
import docker
import base64
from typing import Dict, Tuple, Optional
from docker.errors import DockerException, ContainerError, APIError
from requests.exceptions import ReadTimeout
from workflow.util import LOGGER

client = docker.from_env()

class DockerCodeRunner(BaseModel):
    """
    Handles code execution in Docker containers with optional setup commands.
    Maintains a simple interface while providing reliable code execution capabilities.
    """
    timeout: int = Field(default=30, description="Timeout in seconds for code execution")
    retries: int = Field(default=3, description="Number of retry attempts")
    log_level: str = Field(default='info', description="Logging verbosity")
    images: Dict[str, str] = Field(
        default={
            'python': 'mypython:latest',
            'bash': 'mybash:latest',
            'javascript': 'myjs:latest',
            'typescript': 'myjs:latest'
        },
        description="Mapping of languages to Docker images"
    )

    def _prepare_code(self, code: str) -> str:
        """Normalize and encode code for container execution"""
        code = code.replace('\r\n', '\n').replace('\r', '\n')
        return base64.b64encode(code.encode('utf-8')).decode('utf-8')

    def _get_command(self, code_b64: str, language: str, setup_b64: Optional[str] = None) -> str:
        """Generate the appropriate execution command"""
        if language == 'python':
            setup_cmd = f'$(echo {setup_b64} | base64 -d) && ' if setup_b64 else ''
            return f'bash -c "{setup_cmd}python -c \\"import base64; exec(base64.b64decode(\'{code_b64}\').decode())\\"\"'
        elif language == 'bash':
            return f'bash -c "$(echo {code_b64} | base64 -d)"'
        elif language == 'javascript':
            setup_cmd = f'$(echo {setup_b64} | base64 -d) && ' if setup_b64 else ''
            return f'bash -c "{setup_cmd}echo {code_b64} | base64 -d > /app/script.js && node /app/script.js"'
        elif language == 'typescript':
            setup_cmd = f'$(echo {setup_b64} | base64 -d) && ' if setup_b64 else ''
            return f'bash -c "{setup_cmd}echo {code_b64} | base64 -d > /app/script.ts && ts-node /app/script.ts"'
        else:
            raise ValueError(f"Unsupported language: {language}")
        
    async def run(self, code: str, language: str, setup_commands: Optional[str] = None) -> Tuple[str, int]:
        """
        Execute code in a Docker container.
        
        Args:
            code: The code to execute
            language: Programming language to use
            setup_commands: Optional commands to run before main code execution
            
        Returns:
            Tuple containing (execution logs, exit code)
            
        Raises:
            ValueError: If language is not supported
            DockerException: If container execution fails
        """
        if language not in self.images:
            raise ValueError(f"Unsupported language: {language}")

        code_b64 = self._prepare_code(code)
        setup_b64 = self._prepare_code(setup_commands) if setup_commands else None
        image = self.images[language]

        for attempt in range(self.retries):
            try:
                command = self._get_command(code_b64, language, setup_b64)
                
                container = client.containers.run(
                    image,
                    command,
                    detach=True,
                    stdout=True,
                    stderr=True,
                    network_disabled=False,
                    mem_limit='512m',
                    cpu_quota=50000
                )

                try:
                    exit_status = container.wait(timeout=self.timeout)
                    logs = container.logs(stdout=True, stderr=True).decode('utf-8')
                    
                    return logs, exit_status['StatusCode']
                    
                except ReadTimeout:
                    container.kill()
                    raise TimeoutError(f"Execution exceeded {self.timeout} seconds")
                finally:
                    try:
                        container.remove()
                    except Exception as e:
                        LOGGER.error(f"Failed to remove container: {e}")

            except (ContainerError, DockerException, APIError, TimeoutError) as e:
                LOGGER.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                if attempt == self.retries - 1:
                    raise

        raise DockerException("All retry attempts failed")