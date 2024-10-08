# Workflow Dockerfile
FROM python:3.10

# Install dos2unix utility
RUN apt-get update && apt-get install -y dos2unix

# Create a user with UID 1000
RUN adduser --disabled-password --gecos '' --uid 1000 appuser

# Set the working directory
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt ./

# Install Docker CLI and other utilities
RUN apt-get update && apt-get install -y docker.io iputils-ping curl gosu

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Add the user to the docker group
RUN groupadd -f docker && usermod -aG docker appuser

# Copy the rest of the application code
COPY --chown=appuser:appuser . .

# Set the working directory ownership
RUN chown -R appuser:appuser /app

ENV PYTHONPATH=/app

# Make port 8000 available to the world outside this container
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=20 \
  CMD curl -f http://localhost:${WORKFLOW_PORT_DOCKER}/health || exit 1

# Copy entrypoint script and convert to Unix line endings
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh

RUN chmod +x /entrypoint.sh
RUN ls -la / && ls -la /app && cat /entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Command to run the Python app
CMD ["python", "workflow_logic/main.py"]