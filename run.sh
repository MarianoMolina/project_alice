#!/bin/bash

echo "Launching Docker..."
open -a Docker

echo "Waiting for Docker to start..."
while ! docker info > /dev/null 2>&1; do
    echo "Docker is not ready yet. Waiting..."
    sleep 2
done
echo "Docker is ready!"

echo "Starting LM Studio server..."
lms server start &

echo "Waiting for LM Studio server to start..."
sleep 5

echo "Starting Docker Compose..."
docker-compose up