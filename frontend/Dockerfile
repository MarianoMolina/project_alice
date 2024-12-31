FROM node:18-alpine AS build
WORKDIR /app
COPY .env ./
# Let's see what's actually in the .env file
RUN export HOST=$(grep ^HOST= .env | cut -d '=' -f2-)

# Copy package.json and package-lock.json from frontend directory
COPY frontend/package*.json ./

# Install dependencies with the --legacy-peer-deps flag
RUN npm ci --legacy-peer-deps

# Install TypeScript
RUN npm install -g typescript

# Add `/app/node_modules/.bin` to $PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Copy the frontend application code
COPY frontend/ ./

# Compile TypeScript to JavaScript
RUN tsc

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy the build output to the production image
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.env ./.env
COPY frontend/package.json ./

ENV NODE_ENV=production
EXPOSE ${FRONTEND_PORT_DOCKER}
CMD ["npm", "run", "start:prod"]