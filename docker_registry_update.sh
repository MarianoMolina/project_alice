#!/bin/bash

# Load environment variables
set -a
source .env
set +a

# Check if VERSION is set
if [ -z "$VERSION" ]; then
    echo "ERROR: VERSION not set in .env file"
    exit 1
fi

if [ -z "$REGISTRY_PATH" ]; then
    echo "ERROR: REGISTRY_PATH not set in .env file"
    exit 1
fi

# Set up buildx builder if it doesn't exist
if ! docker buildx inspect multiplatform >/dev/null 2>&1; then
    echo "Creating new buildx builder..."
    docker buildx create --name multiplatform --use
fi

# Function to build and push an image
build_and_push() {
    local name=$1
    local dockerfile=$2
    local context=$3
    local platforms=$4
    local extra_args=${5:-""}
    
    echo "Building $name:$VERSION for platforms: $platforms"
    docker buildx build --platform $platforms \
        -f $dockerfile \
        -t $REGISTRY_PATH/$name:$VERSION \
        -t $REGISTRY_PATH/$name:latest \
        $extra_args \
        --push \
        $context
    
    if [ $? -eq 0 ]; then
        echo "Successfully built and pushed $name for specified platforms"
    else
        echo "Failed to build $name"
        exit 1
    fi
}

# Function specifically for frontend builds
build_frontend() {
    local tag=$1
    local platforms=$2
    local extra_args=${3:-""}
    
    echo "Building frontend:$tag for platforms: $platforms"
    docker buildx build --platform $platforms \
        -f ./frontend/Dockerfile \
        -t $REGISTRY_PATH/frontend:$VERSION \
        -t $REGISTRY_PATH/frontend:$tag \
        $extra_args \
        --push \
        .
    
    if [ $? -eq 0 ]; then
        echo "Successfully built and pushed frontend:$tag"
    else
        echo "Failed to build frontend:$tag"
        exit 1
    fi
}

# Build and push all images
echo "Starting multi-platform build and push process for version $VERSION"

# Backend
build_and_push "backend" "./backend/Dockerfile" "./backend" "linux/amd64,linux/arm64"

# Workflow
build_and_push "workflow" "./workflow/Dockerfile" "./workflow" "linux/amd64,linux/arm64"

# Python image
build_and_push "mypython" "./workflow/Dockerfile.python" "." "linux/amd64,linux/arm64"

# Bash image
build_and_push "mybash" "./workflow/Dockerfile.bash" "." "linux/amd64,linux/arm64"

# JavaScript image
build_and_push "myjs" "./workflow/Dockerfile.js" "." "linux/amd64,linux/arm64"

# Frontend builds
echo "Building frontend versions..."

# Build multi-platform frontend with localhost
build_frontend "latest" "linux/amd64,linux/arm64" "--build-arg REACT_APP_HOST=localhost"

# Build amd64-only frontend for hosted version
build_frontend "hosted" "linux/amd64"

echo "All images built and pushed successfully!"
echo "Version: $VERSION"