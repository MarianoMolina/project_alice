@echo off

:: Create required directories
echo Creating required directories...
mkdir logs 2>nul
mkdir shared-uploads 2>nul
mkdir model_cache 2>nul
mkdir shared 2>nul

:: Set permissions (equivalent to chmod 777 on Unix)
echo Setting directory permissions...
icacls logs /grant Everyone:F /T
icacls shared-uploads /grant Everyone:F /T
icacls model_cache /grant Everyone:F /T
icacls shared /grant Everyone:F /T

echo Launching Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Waiting for Docker to start...
:DOCKER_WAIT_LOOP
timeout /t 2 /nobreak > nul
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not ready yet. Waiting...
    goto DOCKER_WAIT_LOOP
)
echo Docker is ready!

echo Starting LM Studio server...
start /B lms server start

echo Waiting for LM Studio server to start...
timeout /t 5

echo Starting Docker Compose...
docker-compose up