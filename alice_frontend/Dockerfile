# Use the official Node.js image as a base image
FROM node:16 AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with the --legacy-peer-deps flag
RUN npm install --legacy-peer-deps

# Install TypeScript
RUN npm install -g typescript

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN tsc

RUN npm run build

CMD ["npm", "start"]