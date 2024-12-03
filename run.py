import subprocess
import time
import platform
import os
import sys
import logging
from pathlib import Path
import signal
import requests

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
        
class LMStudioManager:
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        self.app_path = None
        self.server_started = False
        self.system = platform.system()
        
    def get_bootstrap_path(self):
        """Get the platform-specific bootstrap path and command"""
        if self.system == "Windows":
            cache_path = os.path.expandvars(r'%USERPROFILE%\.cache\lm-studio\bin\lms.exe')
            bootstrap_cmd = ['cmd', '/c', cache_path, 'bootstrap']
        else:  # macOS or Linux
            cache_path = os.path.expanduser('~/.cache/lm-studio/bin/lms')
            bootstrap_cmd = [cache_path, 'bootstrap']
            
        return cache_path, bootstrap_cmd

    def try_bootstrap_cli(self):
        """Attempt to bootstrap the LM Studio CLI tools"""
        cache_path, bootstrap_cmd = self.get_bootstrap_path()
        
        if os.path.exists(cache_path):
            self.logger.info("Found LMS CLI tool in cache, attempting bootstrap...")
            try:
                result = subprocess.run(bootstrap_cmd, capture_output=True, text=True)
                if result.returncode == 0:
                    self.logger.info("Successfully bootstrapped LMS CLI")
                    return True
                else:
                    self.logger.warning(f"Bootstrap failed: {result.stderr}")
                    return False
            except Exception as e:
                self.logger.warning(f"Bootstrap attempt failed: {e}")
                return False
        else:
            self.logger.warning(f"LMS CLI not found in cache: {cache_path}")
            return False

    def find_lm_studio(self):
        """Find LM Studio installation and ensure CLI is available"""
        cli_locations = [
            "/opt/homebrew/bin/lms",
            "/usr/local/bin/lms",
            os.path.expanduser("~/.cache/lm-studio/bin/lms")
        ] if self.system != "Windows" else [
            os.path.expandvars(r"%USERPROFILE%\.cache\lm-studio\bin\lms.exe")
        ]
        
        for cli_path in cli_locations:
            if os.path.exists(cli_path):
                self.logger.info(f"Found LMS CLI at: {cli_path}")
                self.app_path = cli_path
                return True

        gui_locations = [
            "/Applications/LM Studio.app",
            str(Path.home() / "Applications/LM Studio.app")
        ] if self.system == "Darwin" else []
        
        gui_found = False
        for path in gui_locations:
            if os.path.exists(path):
                self.logger.info(f"Found LM Studio GUI at: {path}")
                gui_found = True
                break

        if gui_found:
            self.logger.info("Found GUI but no CLI. Attempting to bootstrap CLI tools...")
            if self.try_bootstrap_cli():
                for cli_path in cli_locations:
                    if os.path.exists(cli_path):
                        self.app_path = cli_path
                        return True
        
        return False
    def start_server(self):
        """Start LM Studio server handling interactive prompts"""
        if not self.find_lm_studio():
            self.logger.warning("LM Studio not found. Continuing without it...")
            return False

        try:
            # Check if server is already running
            try:
                response = requests.get("http://localhost:1234/v1/models", timeout=2)
                if response.status_code == 200:
                    self.logger.info("LM Studio server is already running")
                    self.server_started = True
                    return True
            except:
                pass

            # Start server with interactive input handling
            self.logger.info(f"Starting LM Studio server using: {self.app_path}")
            process = subprocess.Popen(
                [self.app_path, "server", "start", "--verbose"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Monitor the output and respond to prompts
            while True:
                line = process.stdout.readline()
                if not line:
                    break
                    
                self.logger.debug(f"LM Studio output: {line.strip()}")
                
                if "Type \"OK\" to acknowledge:" in line:
                    self.logger.info("Responding to acknowledgment prompt...")
                    process.stdin.write("OK\n")
                    process.stdin.flush()
                
                if "Verification succeeded" in line:
                    self.logger.info("Server started successfully")
                    self.server_started = True
                    return True

            self.server_started = True
            return True

        except Exception as e:
            self.logger.warning(f"Failed to start LM Studio: {e}")
            return False

    def verify_server(self, timeout=30, interval=2):
        """Verify that the LM Studio server is responding"""
        self.logger.info("Verifying server status...")
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                # First try the greeting endpoint that we saw in the logs
                try:
                    response = requests.get("http://127.0.0.1:1234/lmstudio-greeting", timeout=2)
                    if response.status_code == 200:
                        self.logger.info("LM Studio server is up and responding!")
                        return True
                except:
                    pass

                # Then try the models endpoint
                response = requests.get("http://127.0.0.1:1234/v1/models", timeout=2)
                if response.status_code == 200:
                    self.logger.info("LM Studio server is up and responding!")
                    return True
            except requests.exceptions.ConnectionError:
                self.logger.debug("Server not ready yet - connection refused")
            except Exception as e:
                self.logger.debug(f"Verification attempt failed: {type(e).__name__}")
            time.sleep(interval)
        
        self.logger.warning("LM Studio server verification timed out")
        return False

class RunEnvironment:
    def __init__(self):
        self.system = platform.system()
        self.logger = self._setup_logging()
        self.required_dirs = ["shared-uploads", "logs", "shared", "model_cache"]
        self.lm_studio = LMStudioManager(self.logger)
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
            
            # LM Studio handling
            if self.lm_studio.start_server():
                self.logger.info("Waiting for LM Studio server to start...")
                if not self.lm_studio.verify_server():
                    self.logger.warning("LM Studio server not responding, but continuing anyway...")
            else:
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
                logging.FileHandler('run_script.log')
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