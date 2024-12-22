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

# Function to build and push an image
build_and_push() {
    local name=$1
    local dockerfile=$2
    local context=$3
    
    echo "Building $name:$VERSION..."
    docker build -f $dockerfile -t $REGISTRY_PATH/$name:$VERSION -t $REGISTRY_PATH/$name:latest $context
    
    if [ $? -eq 0 ]; then
        echo "Pushing $name:$VERSION..."
        docker push $REGISTRY_PATH/$name:$VERSION
        if [ $? -ne 0 ]; then
            echo "Failed to push $name:$VERSION"
            exit 1
        fi
        docker push $REGISTRY_PATH/$name:latest
        if [ $? -ne 0 ]; then
            echo "Failed to push $name:latest"
            exit 1
        fi
        echo "Successfully built and pushed $name"
    else
        echo "Failed to build $name"
        exit 1
    fi
}

# Build and push all images
echo "Starting build and push process for version $VERSION"

# Backend
build_and_push "backend" "./backend/Dockerfile" "./backend"

# Workflow
build_and_push "workflow" "./workflow/Dockerfile" "./workflow"

# Python image
build_and_push "mypython" "./workflow/Dockerfile.python" "."

# Bash image
build_and_push "mybash" "./workflow/Dockerfile.bash" "."

# JavaScript image
build_and_push "myjs" "./workflow/Dockerfile.js" "."

echo "All images built and pushed successfully!"
echo "Version: $VERSION"