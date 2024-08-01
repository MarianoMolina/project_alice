@echo off
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