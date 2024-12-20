# Backend Container README

## Overview

The Backend container is a Node.js with Express (TypeScript) application that serves as the core data management and API interface for the Alice project. It is responsible for managing the MongoDB instance, handling all CRUD operations, user authentication, and providing an OpenAI-compatible endpoint for chat and completions that interfaces with the LM Studio deployment.

## Main Features

1. **Database Management**
   - MongoDB instance management
   - CRUD operations for all entities (Agents, Models, Prompts, Parameters, Tasks, APIs, etc.)

2. **User Authentication**
   - User registration and login
   - JWT-based authentication

3. **OpenAI-compatible API**
   - Chat completions endpoint
   - Text completions endpoint
   - Integration with LM Studio for local model deployment

4. **Model Management**
   - Interface with LM Studio for model loading and unloading

## Project Structure

The backend is organized into several key directories:

- `src/models`: Mongoose schema definitions for database entities
- `src/routes`: Express route definitions for API endpoints
- `src/middleware`: Custom middleware for authentication, error handling, etc.
- `src/utils`: Utility functions and helpers
- `src/interfaces`: TypeScript interface definitions

## Key Components

1. **MongoDB Models**: Schemas for various entities (e.g., `Agent`, `Model`, `Prompt`, `Task`, `API`)
2. **Route Handlers**: API endpoints for CRUD operations and specialized functions
3. **Authentication Middleware**: JWT-based user authentication
4. **LM Studio Manager**: Interface for managing local model deployments

## Environment Variables

The backend relies on several environment variables. Ensure these are set in your `.env` file:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation

## Adding New Task Types

To add support for a new task type in the backend:

1. Update the `TaskType` enum in `src/interfaces/task.interface.ts`:

```typescript
export enum TaskType {
  // ... existing types
  NewTaskType = "NewTaskType",
}
```

2. Modify the `taskSchema` in `src/models/task.model.ts` if the new task type requires additional fields:

```typescript
const taskSchema = new Schema<ITaskDocument, ITaskModel>({
  // ... existing fields
  new_task_specific_field: { type: String, required: false },
});
```

3. Update the `apiRepresentation` method in the task model to include any new fields:

```typescript
taskSchema.methods.apiRepresentation = function (this: ITaskDocument) {
  return {
    // ... existing fields
    new_task_specific_field: this.new_task_specific_field || null,
  };
};
```

4. If needed, update the task creation and update logic in `src/routes/task.route.ts` to handle the new task type.

## Adding New API Types

To add support for a new API type in the backend:

1. Update the `ApiType` enum in `src/interfaces/api.interface.ts`:

```typescript
export enum ApiType {
  // ... existing types
  NEW_API = 'new_api',
}
```

2. If needed, add a new `ApiName` to the enum in the same file:

```typescript
export enum ApiName {
  // ... existing names
  NEW_API = 'new_api',
}
```

3. Modify the `apiSchema` in `src/models/api.model.ts` if the new API type requires additional fields:

```typescript
const apiSchema = new Schema<IAPIDocument, IAPIModel>({
  // ... existing fields
  new_api_specific_field: { type: String, required: false },
});
```

4. Update the `apiRepresentation` method in the API model to include any new fields:

```typescript
apiSchema.methods.apiRepresentation = function (this: IAPIDocument) {
  return {
    // ... existing fields
    new_api_specific_field: this.new_api_specific_field || null,
  };
};
```

5. If needed, update the API creation and update logic in `src/routes/api.route.ts` to handle the new API type.

## LM Studio Integration

The backend interfaces with LM Studio for local model deployment. Key files for this integration are:

- `src/utils/lmStudioManager.ts`: Manages model loading, unloading, and interactions
- `src/routes/lmStudio.route.ts`: Defines API endpoints for LM Studio operations

To add support for new model types or LM Studio features, modify these files accordingly.

## Development

To start the development server:

1. Ensure all dependencies are installed: `npm install`
2. Start the development server: `npm run dev`

The server will be available at `http://localhost:3000` by default.

## Building for Production

To create a production build:

1. Run the build script: `npm run build`
2. Start the production server: `npm start`

## Testing

Run the test suite using:

```
npm test
```

## Contributing

Contributions are welcome! Please follow the project's coding standards and submit pull requests for any new features or bug fixes.

## Support

For any issues or questions related to the backend container, please contact the development team or refer to the main project documentation.