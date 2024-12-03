import subprocess
import time
import platform
import os
import shutil

def is_docker_running():
    try:
        subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except subprocess.CalledProcessError:
        return False

def start_docker():
    system = platform.system()
    if system == "Windows":
        subprocess.Popen(["C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"])
    elif system == "Darwin":  # macOS
        subprocess.Popen(["open", "-a", "Docker"])
    elif system == "Linux":
        print("Please ensure Docker is running on your Linux system.")
    else:
        print(f"Unsupported operating system: {system}")
        exit(1)

def get_lms_path():
    system = platform.system()
    if system == "Windows":
        return "lms"
    elif system == "Darwin":  # macOS
        # Try to find lms in common locations
        possible_paths = [
            "/usr/local/bin/lms",
            "/opt/homebrew/bin/lms",
            os.path.expanduser("~/Applications/lms"),
            "/Applications/lms"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
        # If we can't find it, try using which
        try:
            return subprocess.check_output(["which", "lms"], universal_newlines=True).strip()
        except subprocess.CalledProcessError:
            print("Error: Could not find LM Studio executable. Please ensure it's installed and in your PATH.")
            exit(1)
    return "lms"  # Default fallback

def start_lm_studio():
    system = platform.system()
    lms_path = get_lms_path()
    
    if system == "Windows":
        subprocess.Popen([lms_path, "server", "start"], creationflags=subprocess.CREATE_NO_WINDOW)
    else:
        subprocess.Popen([lms_path, "server", "start"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def setup_directories():
    directories = ["shared-uploads", "logs", "shared", "model_cache"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        os.chmod(directory, 0o777)

def main():
    print("Setting up directories...")
    setup_directories()

    print("Launching Docker...")
    start_docker()

    print("Waiting for Docker to start...")
    while not is_docker_running():
        print("Docker is not ready yet. Waiting...")
        time.sleep(2)
    print("Docker is ready!")

    print("Starting LM Studio server...")
    start_lm_studio()
    
    print("Waiting for LM Studio server to start...")
    time.sleep(5)

    print("Starting Docker Compose...")
    subprocess.run(["docker-compose", "up"])

if __name__ == "__main__":
    main()