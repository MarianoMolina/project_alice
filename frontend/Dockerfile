# Use the official Node.js image as a base image
FROM node:16 AS build
# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies with the --legacy-peer-deps flag
RUN npm ci --legacy-peer-deps
# Install TypeScript
RUN npm install -g typescript
# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH
# Copy the rest of the application code
COPY . .
# Compile TypeScript to JavaScript
RUN tsc
# Build the application
RUN npm run build

# Production stage
FROM node:16-alpine
WORKDIR /app
# Copy the build output to the production image
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
ENV NODE_ENV production
EXPOSE ${FRONTEND_PORT_DOCKER}
CMD ["npm", "run", "start:prod"]