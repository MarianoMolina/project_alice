# Use the official Python image as a base image
FROM python:3.10

# Set the working directory
WORKDIR /app

# Copy requirements.txt
COPY requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

ENV PYTHONPATH=/app

RUN apt-get update && apt-get install -y iputils-ping

# Make port 80 available to the world outside this container
EXPOSE 8000

# Command to run the Python app
CMD ["python", "workflow_logic/main.py"]