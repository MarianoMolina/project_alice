# Start with Python base image
FROM python:3.10

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    docker.io \
    iputils-ping \
    curl \
    gosu \
    dos2unix \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Create a user with UID 1000
RUN adduser --disabled-password --gecos '' --uid 1000 appuser

# Set the working directory
WORKDIR /app

# Create model cache directory with proper permissions
RUN mkdir -p /app/model_cache && \
    chown -R appuser:appuser /app/model_cache && \
    chmod -R 755 /app/model_cache

# Install PyTorch CPU version and ML dependencies
RUN pip3 install --no-cache-dir \
    torch \
    torchvision \
    --index-url https://download.pytorch.org/whl/cpu \
    && pip3 install --no-cache-dir \
    transformers \
    diffusers \
    accelerate \
    safetensors

# Copy requirements.txt
COPY requirements.txt ./

# Install other dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Add the user to the docker group
RUN groupadd -f docker && usermod -aG docker appuser

# Copy the rest of the application code
COPY --chown=appuser:appuser . .

# Create a symbolic link for the workflow namespace
RUN ln -s /app /app/workflow

# Set the working directory ownership
RUN chown -R appuser:appuser /app

# Set PYTHONPATH to include the app directory
ENV PYTHONPATH=/app

# Make port 8000 available
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=20 \
  CMD curl -f http://localhost:${WORKFLOW_PORT_DOCKER}/health || exit 1

# Copy entrypoint script and convert to Unix line endings
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Command to run the Python app
CMD ["python3", "-m", "workflow.main"]