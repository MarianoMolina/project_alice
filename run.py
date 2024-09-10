import subprocess
import time
import platform
import os

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

def start_lm_studio():
    subprocess.Popen(["lms", "server", "start"])

def setup_directories():
    os.makedirs("shared-uploads", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    os.chmod("shared-uploads", 0o777)
    os.chmod("logs", 0o777)

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