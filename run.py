import subprocess
import time
import platform
import os
import sys
import logging
from pathlib import Path
import signal
from typing import Optional, Tuple

class THPHandler:
    def __init__(self, logger):
        self.logger = logger
        
    def disable_thp(self):
        """Attempt to disable Transparent Huge Pages"""
        if platform.system() != "Linux":
            self.logger.info("THP handling only necessary on Linux systems")
            return True
            
        try:
            # Check if we have sudo access
            result = subprocess.run(
                ["sudo", "-n", "true"], 
                capture_output=True, 
                check=False
            )
            has_sudo = result.returncode == 0
            
            if has_sudo:
                commands = [
                    "echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/enabled",
                    "echo madvise | sudo tee /sys/kernel/mm/transparent_hugepage/defrag"
                ]
                
                for cmd in commands:
                    result = subprocess.run(
                        cmd,
                        shell=True,
                        capture_output=True,
                        text=True
                    )
                    if result.returncode != 0:
                        self.logger.error(f"Failed to set THP: {result.stderr}")
                        return False
                        
                self.logger.info("Successfully configured THP settings")
                return True
            else:
                self.logger.warning("No sudo access to configure THP. Redis performance may be affected")
                return False
                
        except Exception as e:
            self.logger.error(f"Error configuring THP: {e}")
            return False
        
class LMStudioPathFinder:
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.system = platform.system()

    def get_cli_file_path(self) -> Optional[Path]:
        """Find the LM Studio CLI executable file"""
        self.logger.debug("Searching for LM Studio CLI file...")
        
        if self.system == "Windows":
            search_paths = [
                Path(os.path.expandvars(r"%USERPROFILE%\.cache\lm-studio\bin\lms.exe"))
            ]
        else:  # macOS or Linux
            search_paths = [
                Path("/opt/homebrew/bin/lms"),
                Path("/usr/local/bin/lms"),
                Path.home() / ".cache/lm-studio/bin/lms"
            ]

        for path in search_paths:
            self.logger.debug(f"Checking path: {path}")
            if path.exists() and path.is_file():
                self.logger.info(f"Found LM Studio CLI file at: {path}")
                return path

        self.logger.warning("LM Studio CLI file not found in any standard location")
        return None

    def verify_cli_command(self) -> bool:
        """Verify if 'lms' is available as a command"""
        self.logger.debug("Verifying LM Studio CLI command...")
        
        try:
            result = subprocess.run(
                ['lms', 'version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                self.logger.info(f"LMS CLI confirmed - version:\n{result.stdout.strip()}")
                return True
            else:
                self.logger.warning(f"LMS CLI command check failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.warning(f"LMS CLI command check failed: {str(e)}")
            return False

    def bootstrap_cli(self, cli_path: Path) -> bool:
        """Attempt to bootstrap the LMS CLI"""
        self.logger.info("Attempting to bootstrap LMS CLI...")
        try:
            bootstrap_cmd = ['cmd', '/c', str(cli_path), 'bootstrap'] if self.system == "Windows" else [str(cli_path), 'bootstrap']
            
            result = subprocess.run(
                bootstrap_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.logger.info("Bootstrap completed successfully")
                return True
            else:
                self.logger.error(f"Bootstrap failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"Bootstrap failed: {str(e)}")
            return False

    def setup_lms_cli(self) -> bool:
        """Orchestrates the LMS CLI setup process"""
        # Check for CLI file
        cli_path = self.get_cli_file_path()
        if not cli_path:
            self.logger.error("LMS CLI file not found - cannot proceed")
            return False

        # Check if CLI already works
        if self.verify_cli_command():
            self.logger.info("LMS CLI is already working")
            return True

        # Attempt bootstrap
        if not self.bootstrap_cli(cli_path):
            self.logger.error("Bootstrap failed - cannot proceed")
            return False

        # Verify CLI works after bootstrap
        if self.verify_cli_command():
            self.logger.info("LMS CLI successfully set up")
            return True
        
        self.logger.error("LMS CLI setup failed")
        return False
    
    def _run_lms_command(self, command: list[str], timeout: int = 5) -> Tuple[bool, str]:
        """Run an LMS CLI command and return success status and output"""
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                encoding='utf-8',
                errors='replace',
                timeout=timeout
            )
            return result.returncode == 0, result.stdout + result.stderr
        except Exception as e:
            self.logger.error(f"Command failed: {' '.join(command)}, error: {str(e)}")
            return False, str(e)

    def verify_cli_command(self) -> bool:
        """Verify if 'lms' is available as a command"""
        success, output = self._run_lms_command(['lms', 'version'])
        if success:
            self.logger.info(f"LMS CLI command verified: {output}")
            return True
        self.logger.warning("LMS CLI command verification failed")
        return False

    def check_server_status(self) -> bool:
        """Check if the LMS server is running"""
        success, output = self._run_lms_command(['lms', 'status'])
        return success and "Server:  ON" in output

    def execute_server_start(self) -> bool:
        """Execute the server start command"""
        success, output = self._run_lms_command(['lms', 'server', 'start'], timeout=30)
        if success and "Verification succeeded" in output:
            self.logger.info("Server start command executed successfully")
            return True
        self.logger.error(f"Server start failed: {output}")
        return False

    def start_lms_server(self) -> bool:
        """Start the LMS server if it's not already running"""
        self.logger.info("Checking LMS server status...")

        if self.check_server_status():
            self.logger.info("LMS server is already running")
            return True

        self.logger.debug("Server not running, attempting to start")
        if not self.execute_server_start():
            return False

        # Verify server started successfully
        if self.check_server_status():
            self.logger.info("Server start verified")
            return True

        self.logger.error("Server start verification failed")
        return False

class RunEnvironment:
    def __init__(self):
        self.system = platform.system()
        self.logger = self._setup_logging()
        self.required_dirs = ["shared-uploads", "logs", "model_cache"]
        self.lm_studio = LMStudioPathFinder(self.logger)
        self.thp_handler = THPHandler(self.logger)
        
    def run(self):
        """Main execution flow."""
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)

        try:
            self.setup_directories()
            
            # Handle THP before starting Docker
            if self.system == "Linux":
                self.thp_handler.disable_thp()
                
            self.start_docker()
            self.wait_for_docker()
            if self.lm_studio.setup_lms_cli():
                self.logger.info("LMS CLI setup succeeded")
                if self.lm_studio.start_lms_server():
                    self.logger.info("LMS server started successfully")
                else:
                    self.logger.warning("Failed to start LMS server")
                self.logger.warning("LM Studio server not available, continuing without it...")
            
            self.run_docker_compose()
        except Exception as e:
            self.logger.error(f"Run failed: {e}")
            self.cleanup(None, None)
                    
    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('logs/run_script.log')
            ]
        )
        return logging.getLogger(__name__)

    def setup_directories(self):
        """Create and set permissions for required directories."""
        self.logger.info("Setting up directories...")
        for directory in self.required_dirs:
            Path(directory).mkdir(exist_ok=True)
            if self.system == "Windows":
                try:
                    subprocess.run(["icacls", directory, "/grant", "Everyone:F", "/T"], 
                                 check=True, capture_output=True)
                except subprocess.CalledProcessError as e:
                    self.logger.error(f"Failed to set permissions for {directory}: {e}")
            else:
                try:
                    os.chmod(directory, 0o777)
                except OSError as e:
                    self.logger.error(f"Failed to set permissions for {directory}: {e}")

    def is_docker_running(self):
        """Check if Docker daemon is running."""
        try:
            subprocess.run(["docker", "info"], 
                         stdout=subprocess.DEVNULL, 
                         stderr=subprocess.DEVNULL, 
                         check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def start_docker(self):
        """Start Docker based on platform."""
        self.logger.info("Starting Docker...")
        try:
            if self.system == "Windows":
                subprocess.Popen([r"C:\Program Files\Docker\Docker\Docker Desktop.exe"])
            elif self.system == "Darwin":
                subprocess.Popen(["open", "-a", "Docker"])
            elif self.system == "Linux":
                self.handle_linux_specific()
            else:
                raise OSError(f"Unsupported operating system: {self.system}")
        except Exception as e:
            self.logger.error(f"Failed to start Docker: {e}")
            sys.exit(1)

    def wait_for_docker(self, timeout=300):
        """Wait for Docker to be ready with timeout."""
        self.logger.info("Waiting for Docker to start...")
        start_time = time.time()
        while not self.is_docker_running():
            if time.time() - start_time > timeout:
                self.logger.error("Docker failed to start within timeout period")
                sys.exit(1)
            self.logger.info("Docker is not ready yet. Waiting...")
            time.sleep(2)
        self.logger.info("Docker is ready!")

    def run_docker_compose(self):
        """Run docker-compose up with proper error handling."""
        self.logger.info("Starting Docker Compose...")
        try:
            subprocess.run(["docker-compose", "up"], check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Docker Compose failed: {e}")
            sys.exit(1)

    def cleanup(self, signum, frame):
        """Cleanup handler for graceful shutdown."""
        self.logger.info("Cleaning up...")
        try:
            subprocess.run(["docker-compose", "down"], check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Cleanup failed: {e}")
        sys.exit(0)

if __name__ == "__main__":
    env = RunEnvironment()
    env.run()