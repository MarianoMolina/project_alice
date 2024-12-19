from pydantic import BaseModel, Field
import docker
import base64, time
from threading import Thread
from queue import Queue
from typing import Dict, Tuple, Optional, List
from docker.errors import DockerException, ContainerError, APIError
from requests.exceptions import ReadTimeout, ConnectionError
from urllib3.exceptions import ReadTimeoutError
from workflow.util import LOGGER

class DockerCodeRunner(BaseModel):
    """
    Handles code execution in Docker containers with optional setup commands.
    Maintains a simple interface while providing reliable code execution capabilities.
    """
    timeout: int = Field(default=120, description="Timeout in seconds for code execution")
    retries: int = Field(default=1, description="Number of retry attempts")
    log_level: str = Field(default='debug', description="Logging verbosity")
    images: Dict[str, str] = Field(
        default={
            'python': 'mypython:latest',
            'shell': 'mybash:latest',
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
        elif language == 'shell':
            return f'bash -c "echo {code_b64} | base64 -d > /tmp/script.sh && chmod +x /tmp/script.sh && /tmp/script.sh"'
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
        client = docker.from_env()
        if language not in self.images:
            raise ValueError(f"Unsupported language: {language}")

        code_b64 = self._prepare_code(code)
        setup_b64 = self._prepare_code(setup_commands) if setup_commands else None
        image = self.images[language]
        errors: List[str] = []

        for attempt in range(self.retries):
            LOGGER.debug(f"Attempt {attempt + 1}...")
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
                    log_collector = ContainerLogCollector(container)
                    log_collector.start()
                    
                    exit_status = container.wait(timeout=self.timeout)
                    logs = log_collector.get_logs()
                    
                    # Check collector status
                    if log_collector.collection_error:
                        LOGGER.warning(f"Note: Log collection encountered an error: {log_collector.collection_error}")
                        
                    LOGGER.debug(f"Exit status: {exit_status['StatusCode']} - Execution logs: {logs}")
                    return logs, exit_status['StatusCode']
                    
                except (ReadTimeout, ReadTimeoutError, ConnectionError) as e:
                    try:
                        logs = log_collector.get_logs()
                        # Check collector status in timeout case
                        if log_collector.collection_error:
                            LOGGER.warning(f"Log collection failed during timeout: {log_collector.collection_error}")
                            
                        LOGGER.warning(f"Timeout reached. Partial logs: {logs}")
                        container.kill()
                    except Exception as e:
                        LOGGER.warning(f"Error killing container in timeout handler: {e}")
                    raise TimeoutError(f"Timeout: Execution exceeded {self.timeout} seconds. Partial logs: {logs}")
                finally:
                    try:
                        if log_collector.is_running:
                            time.sleep(0.1)  # Give collector a chance to get final logs
                        container.remove()
                    except Exception as e:
                        LOGGER.warning(f"Error while removing container: {e}")

            except (ContainerError, DockerException, APIError, TimeoutError) as e:
                LOGGER.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                errors.append(str(e))
                continue
        return f"{attempt + 1} attempts failed: {str('\n'.join(errors))}", 1
    
class ContainerLogCollector:
    def __init__(self, container, max_size: int = 10000):
        self.container = container
        self.logs: Queue = Queue(maxsize=max_size)
        self.collector_thread: Optional[Thread] = None
        self.collection_error: Optional[Exception] = None
        self.is_running = False
        
    def _collect_logs(self):
        self.is_running = True
        try:
            for line in self.container.logs(stream=True):
                if self.logs.full():
                    self.logs.get()
                self.logs.put(line)
        except Exception as e:
            self.collection_error = e  # Store the error
            LOGGER.warning(f"Log collection error: {e}")
        finally:
            self.is_running = False
            
    def start(self):
        self.collector_thread = Thread(target=self._collect_logs)
        self.collector_thread.daemon = True
        self.collector_thread.start()
        
    def get_logs(self) -> str:
        if not self.is_running and self.collection_error:
            LOGGER.warning(f"Note: Log collection failed with error: {self.collection_error}")
        # Convert queue to list and decode bytes
        logs = []
        while not self.logs.empty():
            logs.append(self.logs.get().decode('utf-8'))
        return ''.join(logs)