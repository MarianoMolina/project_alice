FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install TypeScript globally
RUN npm install -g typescript ts-node

# Set the working directory
WORKDIR /app

# Create a package.json with common dependencies
COPY workflow/container.package.json ./package.json
COPY workflow/container.tsconfig.json ./tsconfig.json

# Install dependencies
RUN npm install

CMD ["bash"]