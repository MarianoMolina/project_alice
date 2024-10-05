import docker, time, re, base64
from typing import Tuple
from docker.errors import DockerException, ContainerError, APIError
from requests.exceptions import ReadTimeout

def run_code(code: str, language: str, timeout: int = 30, retries: int = 3, log_level='info') -> Tuple[str, int]:
    client = docker.from_env()
    images = {
        'python': ['mypython:latest'],
        'bash': ['mybash:latest']
    }
    if language not in images:
        raise ValueError(f"Unsupported language: {language}")
    
    error = None
    code = code.replace('\r\n', '\n').replace('\r', '\n')
    code_b64 = base64.b64encode(code.encode('utf-8')).decode('utf-8')

    def log(message, level='info'):
        if log_level == 'debug' or (log_level == 'info' and level == 'info'):
            print(message)

    for attempt in range(1, retries + 1):
        for image in images[language]:
            try:
                if language == 'python':
                    command_str = 'python -c "import base64; exec(base64.b64decode(\'$CODE_B64\').decode())"' if log_level == 'info' else (
                        'set -x; '
                        'echo "$CODE_B64" | base64 -d > script.py && '
                        'echo "import base64" | cat - script.py > temp && mv temp script.py && '
                        'python script.py'
                    )
                elif language == 'bash':
                    command_str = 'bash -c "$(echo $CODE_B64 | base64 -d)"' if log_level == 'info' else (
                        'set -x; '
                        'echo "$CODE_B64" | base64 -d > script.sh && '
                        'cat -v script.sh && '
                        'bash script.sh'
                    )
                
                log(f"Executing command: {command_str}", 'debug')
                
                container = client.containers.run(
                    image,
                    ['bash', '-c', command_str],
                    detach=True,
                    stdout=True,
                    stderr=True,
                    network_disabled=False,
                    mem_limit='512m',
                    cpu_quota=50000,
                    environment={'CODE_B64': code_b64}
                )
                
                try:
                    exit_status = container.wait(timeout=timeout)
                except (docker.errors.APIError, ReadTimeout) as e:
                    container.kill()
                    raise TimeoutError(f"Execution exceeded {timeout} seconds") from e
                
                logs = container.logs(stdout=True, stderr=True)
                logs_decoded = logs.decode('utf-8')
                clean_logs = remove_content(logs_decoded)
                
                if exit_status['StatusCode'] != 0:
                    error_message = f"Non-zero exit status: {exit_status['StatusCode']}\nLogs:\n{clean_logs}"
                    raise RuntimeError(error_message)
                
                container.remove()
                return clean_logs, exit_status['StatusCode']
            
            except (ContainerError, DockerException, APIError, RuntimeError, TimeoutError, ReadTimeout) as e:
                error = e
                log(f"Attempt {attempt}, Image '{image}': {str(e)}\n", 'debug')
                continue
        
        time.sleep(1)
    
    raise error

def remove_content(input_string):
    # Regex patterns to match both formats
    patterns = [
        r'echo[\s\S]*?mv temp script\.py',  # Original pattern
        r'echo[\s\S]*?cat -v script\.sh'    # New pattern
    ]
    
    for pattern in patterns:
        # Check if the pattern exists in the input string
        if re.search(pattern, input_string):
            # Remove the matched content
            input_string = re.sub(pattern, '', input_string)
    
    # Remove leading/trailing whitespace and return
    return input_string.strip()