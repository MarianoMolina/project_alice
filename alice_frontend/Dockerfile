# # Use the official Node.js image as a base image
# FROM node:16 AS build

# # Set the working directory
# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies with the --legacy-peer-deps flag
# RUN npm install --legacy-peer-deps

# # Install TypeScript
# RUN npm install -g typescript

# # Copy the rest of the application code
# COPY . .

# # Compile TypeScript to JavaScript
# RUN tsc

# # Build the React app
# RUN npm run build

# Use a lightweight Node.js image for production
FROM node:16-alpine

# Set the working directory
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=build /app/build ./build

# Install a lightweight web server
RUN npm install -g serve

# Set the command to serve the app using the build directory
CMD ["serve", "-s", "build", "-l", "4000"]
