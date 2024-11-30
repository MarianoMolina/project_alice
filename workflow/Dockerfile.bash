# Dockerfile.bash -> For running bash commands in a container
FROM ubuntu:latest

# Install required packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    coreutils \
    ca-certificates \
    jq \
    bc && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Command to keep the container alive (if needed)
CMD ["bash"]
