# Use the official Node.js image as a base image
FROM node:16

# Create a user with UID 1000
RUN adduser --disabled-password --gecos '' --uid 1000 appuser

# Set the working directory ownership
RUN chown -R appuser:appuser /app

# Switch to the new user
USER appuser

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Build the TypeScript code
RUN npm run build

# Expose the application port
EXPOSE 3000

# Health check to indicate when the service is ready
HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=20 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the backend server
CMD ["node", "dist/index.js"]