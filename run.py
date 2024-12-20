import subprocess
import time
import platform
import os
import sys
import logging
import signal
from pathlib import Path
from typing import Optional, Tuple, List

class DirectoryManager:
    """Handles creation and permission setting for directories"""
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.system = platform.system()
        self.logger = logger or logging.getLogger(__name__)

    def ensure_directory(self, directory: str | Path) -> bool:
        """
        Create a directory and set appropriate permissions.
        Returns True if successful, False otherwise.
        """
        try:
            Path(directory).mkdir(exist_ok=True)
            if self.system == "Windows":
                try:
                    subprocess.run(
                        ["icacls", str(directory), "/grant", "Everyone:F", "/T"],
                        check=True,
                        capture_output=True
                    )
                except subprocess.CalledProcessError as e:
                    self.logger.error(f"Failed to set permissions for {directory}: {e}")
                    return False
            else:
                try:
                    os.chmod(str(directory), 0o777)
                except OSError as e:
                    self.logger.error(f"Failed to set permissions for {directory}: {e}")
                    return False
            return True
        except Exception as e:
            self.logger.error(f"Failed to create directory {directory}: {e}")
            return False

    def ensure_directories(self, directories: List[str | Path]) -> bool:
        """
        Create multiple directories and set appropriate permissions.
        Returns True if all directories were created successfully, False otherwise.
        """
        return all(self.ensure_directory(directory) for directory in directories)

class THPHandler:
    def __init__(self, logger):
        self.logger = logger
        self.system = platform.system()

    def _get_current_thp_setting(self):
        """Check current THP setting to see if changes are needed"""
        try:
            if self.system == "Darwin":
                result = subprocess.run(
                    ["docker", "run", "--rm", "--privileged", "ubuntu:latest", 
                     "cat", "/sys/kernel/mm/transparent_hugepage/enabled"],
                    capture_output=True,
                    text=True
                )
                self.logger.debug(f"THP check output: {result.stdout}")
                return result.returncode == 0 and "[madvise]" in result.stdout
            elif self.system == "Linux":
                result = subprocess.run(
                    ["cat", "/sys/kernel/mm/transparent_hugepage/enabled"],
                    capture_output=True,
                    text=True
                )
                return result.returncode == 0 and "[madvise]" in result.stdout
            elif self.system == "Windows":
                # Try reading the setting directly first
                result = subprocess.run(
                    ["wsl", "--exec", "cat", "/sys/kernel/mm/transparent_hugepage/enabled"],
                    capture_output=True,
                    text=True
                )
                return result.returncode == 0 and "[madvise]" in result.stdout
                
        except Exception as e:
            self.logger.error(f"Failed to check THP setting: {e}")
            return False

    def disable_thp(self):
        """Configure Transparent Huge Pages to use madvise mode"""
        if self._get_current_thp_setting():
            self.logger.info("THP already configured correctly")
            return True

        self.logger.info("Configuring THP settings...")
        
        try:
            if self.system == "Darwin":
                # Create a persistent container to modify THP settings
                container_name = "thp-config"
                
                # Remove existing container if it exists
                subprocess.run(["docker", "rm", "-f", container_name], 
                             capture_output=True)
                
                # Run configuration in a persistent privileged container
                commands = [
                    ["docker", "run", "-d", "--name", container_name, 
                     "--privileged", "ubuntu:latest", "sleep", "infinity"],
                    ["docker", "exec", container_name, "sh", "-c", 
                     "echo madvise > /sys/kernel/mm/transparent_hugepage/enabled"],
                    ["docker", "exec", container_name, "sh", "-c", 
                     "echo madvise > /sys/kernel/mm/transparent_hugepage/defrag"],
                ]
                
                for cmd in commands:
                    self.logger.debug(f"Running command: {cmd}")
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    if result.returncode != 0:
                        self.logger.error(f"Command failed: {result.stderr}")
                        return False
                
                # Clean up the container
                subprocess.run(["docker", "rm", "-f", container_name], 
                             capture_output=True)
                
            elif self.system == "Linux":
                commands = [
                    ["sh", "-c", "echo madvise > /sys/kernel/mm/transparent_hugepage/enabled"],
                    ["sh", "-c", "echo madvise > /sys/kernel/mm/transparent_hugepage/defrag"]
                ]
                for cmd in commands:
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    if result.returncode != 0:
                        self.logger.error(f"Command failed: {result.stderr}")
                        return False
                        
            elif self.system == "Windows":
                # Let's try something simpler - use WSL's built-in root user
                commands = [
                    'echo madvise | tee /sys/kernel/mm/transparent_hugepage/enabled',
                    'echo madvise | tee /sys/kernel/mm/transparent_hugepage/defrag'
                ]
                
                for cmd in commands:
                    # Use WSL's root user directly
                    result = subprocess.run(
                        ["wsl", "-u", "root", "-e", "sh", "-c", cmd],
                        capture_output=True,
                        text=True
                    )
                    if result.returncode != 0:
                        self.logger.error(f"Command failed: {result.stderr}")
                        return False

            return self._get_current_thp_setting()

        except Exception as e:
            self.logger.error(f"Error configuring THP: {e}")
            return False
                        
class LMStudioPathFinder:
    """
    Handles LM Studio CLI discovery, setup, and server management.
    """
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.system = platform.system()
        self.cli_path: Optional[Path] = None
        self._find_cli()
        
    def _find_cli(self) -> None:
        """Initialize by looking for the CLI in standard locations"""
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
                self.cli_path = path
                self.logger.debug(f"Found LM Studio CLI at: {path}")
                break

    def _run_command(self, args: list[str], timeout: int = 5) -> Tuple[bool, str]:
        """
        Run an LMS command and return success status and output.
        
        Args:
            args: Command arguments to pass to lms
            timeout: Command timeout in seconds
            
        Returns:
            Tuple of (success boolean, output/error string)
        """
        try:
            command = [str(self.cli_path)] if self.cli_path else ['lms']
            command.extend(args)
            
            result = subprocess.run(
                command,
                capture_output=True,
                encoding='utf-8',
                errors='replace',
                timeout=timeout
            )
            
            if result.returncode == 0:
                return True, result.stdout
            return False, result.stderr
                
        except subprocess.TimeoutExpired:
            return False, f"Command timed out after {timeout} seconds"
        except Exception as e:
            return False, str(e)

    def bootstrap(self) -> bool:
        """
        Bootstrap the LMS CLI if needed.
        """
        if not self.cli_path:
            self.logger.error("Cannot bootstrap - CLI path not found")
            return False
            
        self.logger.info("Attempting to bootstrap LMS CLI...")
        
        # Windows needs special handling for bootstrap command
        bootstrap_cmd = ['bootstrap']
        if self.system == "Windows":
            bootstrap_cmd = ['cmd', '/c', str(self.cli_path), 'bootstrap']
            
        try:
            result = subprocess.run(
                bootstrap_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.logger.info("Bootstrap completed successfully")
                return True
                
            self.logger.error(f"Bootstrap failed: {result.stderr}")
            return False
            
        except Exception as e:
            self.logger.error(f"Bootstrap failed: {str(e)}")
            return False

    def check_cli(self) -> bool:
        """
        Check if the CLI is working by running version command.
        """
        success, output = self._run_command(['version'])
        if success:
            self.logger.debug(f"CLI check successful: {output}")
            return True
            
        self.logger.debug("CLI check failed")
        return False

    def check_server(self) -> bool:
        """
        Check if the LMS server is running.
        """
        success, output = self._run_command(['status'])
        is_running = success and "Server:  ON" in output
        
        self.logger.debug(f"Server status check: {'running' if is_running else 'not running'}")
        return is_running

    def start_server(self) -> bool:
        """
        Attempt to start the LMS server.
        """
        if self.check_server():
            self.logger.info("Server is already running")
            return True
            
        self.logger.info("Starting LMS server...")
        success, output = self._run_command(['server', 'start'], timeout=30)
        
        if not success:
            self.logger.error(f"Failed to start server: {output}")
            return False
            
        # Verify server actually started
        if self.check_server():
            self.logger.info("Server started successfully")
            return True
            
        self.logger.error("Server start command succeeded but server is not running")
        return False

    def setup(self) -> bool:
        """
        Complete setup process for LM Studio CLI and server.
        
        Returns:
            bool: True if setup successful and server is running
        """
        # First verify CLI works
        if not self.check_cli():
            self.logger.info("CLI not working, attempting bootstrap...")
            if not self.bootstrap() or not self.check_cli():
                self.logger.error("Failed to setup CLI")
                return False
                
        # Then handle server
        if not self.start_server():
            self.logger.error("Failed to start server")
            return False
            
        return True

class RunEnvironment:
    def __init__(self):
        self.system = platform.system()
        self.required_dirs = ["shared-uploads", "logs", "model_cache"]
        
        # Set up the logger first without any handlers
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        
        # Start with basic console logging
        self._setup_basic_logging()
        
        # Initialize directory manager with our logger
        self.dir_manager = DirectoryManager(self.logger)
        
        # Ensure logs directory exists and set up full logging
        if self.dir_manager.ensure_directory("logs"):
            self._setup_full_logging()
        else:
            self.logger.error("Failed to create logs directory. Continuing with basic logging.")
            
        # Initialize other components
        self.lm_studio = LMStudioPathFinder(self.logger)
        self.thp_handler = THPHandler(self.logger)
        
    def run(self):
        """Main execution flow."""
        self.logger.info("=== Starting Project Alice ===")
        self.logger.info("System detected: " + self.system)
        signal.signal(signal.SIGINT, self.cleanup)
        signal.signal(signal.SIGTERM, self.cleanup)
        
        try:
            # Setup directories first
            self.logger.info("[Step 1/5] Setting up required directories...")
            self.setup_directories()
            self.logger.info("[Step 1/5] [OK] Directories ready")
            
            # Start Docker before THP configuration
            self.logger.info("[Step 2/5] Initializing Docker...")
            self.start_docker()
            self.wait_for_docker()
            self.logger.info("[Step 2/5] [OK] Docker initialized")
            
            # Configure THP after Docker is running
            self.logger.info("[Step 3/5] Configuring Transparent Huge Pages...")
            if not self.thp_handler.disable_thp():
                self.logger.warning("[Step 3/5] [WARN] THP configuration failed - Redis performance may be affected")
            else:
                self.logger.info("[Step 3/5] [OK] THP configured")
            
            self.logger.info("[Step 4/5] Initializing LM Studio...")
            if self.lm_studio.setup():
                self.logger.info("[Step 4/5] [OK] LM Studio ready")
            else:
                self.logger.warning("[Step 4/5] [WARN] LM Studio unavailable - continuing without it")
            
            self.logger.info("[Step 5/5] Starting Docker project...")
            self.run_docker_compose()
            
        except Exception as e:
            self.logger.error(f"[ERROR] Fatal error: {e}")
            self.cleanup(None, None)
            
        self.logger.info("=== Project Alice Running ===")

    def _setup_basic_logging(self):
        """Set up basic console logging for initial operations"""
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Add console handler
        console_handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter('%(asctime)s - %(message)s')
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
    def _setup_full_logging(self):
        """Set up full logging with both console and file handlers"""
        # Clear existing handlers
        self.logger.handlers.clear()
            
        # Configure new handlers
        console_handler = logging.StreamHandler(sys.stdout)
        file_handler = logging.FileHandler('logs/run_script.log')
        
        # Set format for both handlers
        formatter = logging.Formatter('%(asctime)s - %(message)s')
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)
        
        # Add handlers to logger
        self.logger.addHandler(console_handler)
        self.logger.addHandler(file_handler)        

    def setup_directories(self):
        """Create and set permissions for all required directories."""
        if not self.dir_manager.ensure_directories(self.required_dirs):
            self.logger.error("Failed to set up one or more required directories")
            sys.exit(1)

    def start_docker(self):
        """Start Docker based on platform."""
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
            
    def handle_linux_specific(self):
        """Handle Docker startup for Linux systems with proper error handling."""
        try:
            # First verify we can use sudo (this command should always work without password)
            try:
                subprocess.run(
                    ["sudo", "-n", "true"],
                    check=True,
                    stderr=subprocess.DEVNULL
                )
            except subprocess.CalledProcessError:
                self.logger.error("""
    Sudo access required to manage Docker service.
    Please ensure this script can run with sudo privileges.
    You may need to configure NOPASSWD in sudoers or run the script with sudo.""")
                sys.exit(1)

            # Check if Docker service exists
            service_check = subprocess.run(
                ["sudo", "systemctl", "list-unit-files", "docker.service"],
                capture_output=True,
                text=True
            )
            
            if "docker.service" not in service_check.stdout:
                self.logger.error("Docker service not found. Please ensure Docker is installed.")
                sys.exit(1)
                
            # Always use sudo to check and manage Docker
            status = subprocess.run(
                ["sudo", "systemctl", "is-active", "docker"],
                capture_output=True,
                text=True
            )
            
            if status.stdout.strip() != "active":
                self.logger.info("Docker service not running. Starting with sudo...")
                try:
                    subprocess.run(
                        ["sudo", "systemctl", "start", "docker"],
                        check=True,
                        stderr=subprocess.PIPE
                    )
                    self.logger.info("Docker service started successfully")
                    
                    # Give the service a moment to fully initialize
                    time.sleep(5)
                    
                except subprocess.CalledProcessError as e:
                    self.logger.error("Failed to start Docker service even with sudo")
                    sys.exit(1)
                    
                # Verify the service started successfully
                verify_status = subprocess.run(
                    ["sudo", "systemctl", "is-active", "docker"],
                    capture_output=True,
                    text=True
                )
                if verify_status.stdout.strip() != "active":
                    raise RuntimeError("Failed to start Docker service")
                    
        except FileNotFoundError as e:
            self.logger.error(f"Required system command not found: {e.filename}")
            sys.exit(1)
        except Exception as e:
            self.logger.error(f"Unexpected error managing Docker service: {e}")
            sys.exit(1)
            
    def wait_for_docker(self, timeout=300):
        """Wait for Docker to be ready with timeout."""
        self.logger.info("Waiting for Docker to start...")
        start_time = time.time()
        iteration = 1
        check_interval = 2  # seconds between checks
        max_iterations = timeout // check_interval

        while not self.is_docker_running():
            if time.time() - start_time > timeout:
                self.logger.error("Docker failed to start within timeout period")
                sys.exit(1)
                
            # Clear the previous line and write the new status
            print(f"\rDocker is not ready yet. Waiting... [{iteration}/{max_iterations}]", end='', flush=True)
            iteration += 1
            time.sleep(check_interval)
        
        # Clear the waiting message and show ready message on new line
        print("\r" + " " * 70 + "\r", end='')  # Clear the line
        self.logger.info("Docker is ready!")

    def is_docker_running(self):
        """Check if Docker daemon is running."""
        try:
            subprocess.run(["sudo", "docker", "info"], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL, 
                        check=True)
            return True
        except subprocess.CalledProcessError:
            return False

    def run_docker_compose(self):
        """Run docker-compose up with proper error handling."""
        self.logger.info("Starting Docker Compose...")
        try:
            subprocess.run(["sudo", "docker-compose", "up"], check=True)
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Docker Compose failed: {e}")
            sys.exit(1)

    def cleanup(self, signum, frame):
        """Cleanup handler for graceful shutdown."""
        self.logger.info("=== Starting Cleanup ===")
        try:
            # Check if docker-compose exists before trying to use it
            compose_check = subprocess.run(
                ["which", "docker-compose"],
                capture_output=True,
                text=True
            )
            if compose_check.stdout.strip():
                subprocess.run(["sudo", "docker-compose", "down"], check=True)
                self.logger.info("Successfully shut down all services")
            else:
                self.logger.warning("docker-compose not found, skipping container cleanup")
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Cleanup failed: {e}")
        self.logger.info("=== Cleanup Complete ===")
        sys.exit(0)
if __name__ == "__main__":
    env = RunEnvironment()
    env.run()