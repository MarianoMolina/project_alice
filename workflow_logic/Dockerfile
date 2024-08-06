# Workflow Dockerfile
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Docker CLI
RUN apt-get update && apt-get install -y docker.io

# Add the user to the docker group
RUN groupadd -f docker && usermod -aG docker root

# Copy the rest of the application code
COPY . .

ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y iputils-ping

# Make port 80 available to the world outside this container
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=20 \
  CMD curl -f http://localhost:${WORKFLOW_PORT_DOCKER}/health || exit 1

# Command to run the Python app
CMD ["python", "workflow_logic/main.py"]