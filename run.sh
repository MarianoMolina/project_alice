# Create required directories
mkdir -p logs shared-uploads model_cache shared
chmod 777 logs shared-uploads model_cache shared

echo "Disabling Transparent Huge Pages (THP)..."
if [ -f /sys/kernel/mm/transparent_hugepage/enabled ]; then
    echo "Disabling THP at /sys/kernel/mm/transparent_hugepage/enabled"
    sudo sh -c "echo madvise > /sys/kernel/mm/transparent_hugepage/enabled"
fi

if [ -f /sys/kernel/mm/transparent_hugepage/defrag ]; then
    echo "Disabling THP defrag at /sys/kernel/mm/transparent_hugepage/defrag"
    sudo sh -c "echo madvise > /sys/kernel/mm/transparent_hugepage/defrag"
fi

echo "Launching Docker..."
open -a Docker

echo "Waiting for Docker to start..."
while ! docker info > /dev/null 2>&1; do
    echo "Docker is not ready yet. Waiting..."
    sleep 2
done
echo "Docker is ready!"

echo "Starting LM Studio server..."
nohup lms server start > /dev/null 2>&1 &
echo "Waiting for LM Studio server to start..."
sleep 5

echo "Starting Docker Compose..."
docker-compose up