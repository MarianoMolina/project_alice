# Frontend Container README

## Overview

The Frontend container is a React-based application that serves as the user interface for the Alice project. It interacts with both the Backend and Workflow containers to provide a seamless experience for managing database objects, executing tasks, and running chat completions.

## Main Features

1. **Database Management**
   - Display, create, and edit all object types in the database
   - Supports various entities: Agents, Models, Prompts, Parameters, Tasks, APIs, etc.

2. **Task Execution**
   - Interface for creating and executing various types of tasks
   - View and analyze task results

3. **Chat Completions**
   - Manage and participate in chat conversations with AI agents
   - Integrate task results into ongoing conversations

4. **User Management**
   - User authentication and authorization
   - User settings and profile management

## Project Structure

The frontend is organized into several key directories:

- `src/components`: Reusable React components
- `src/pages`: Main page components for different routes
- `src/context`: React context providers for global state management
- `src/services`: API service functions for backend communication
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions and helpers

## Key Components

1. **EnhancedComponents**: Flexible components for displaying and editing different entity types (e.g., `EnhancedTask`, `EnhancedAgent`, `EnhancedAPI`)
2. **VerticalMenuSidebar**: Navigation component for different sections of the application
3. **ApiContext**: Context provider for API-related functions
4. **TaskContext**: Context provider for task-related state and functions
5. **ChatContext**: Context provider for chat-related state and functions

## Adding New Task Types

To add support for a new task type in the frontend:

1. Update the `TaskType` enum in `src/types/TaskTypes.ts`:

```typescript
export type TaskType = "ExistingType1" | "ExistingType2" | ... | "NewTaskType";
```

2. Modify the `TaskFlexibleView` component in `src/components/enhanced/task/task/TaskFlexibleView.tsx`:

```typescript
import NewTaskTypeForm from './task_types/NewTaskTypeForm';

// In the renderTaskForm function:
case 'NewTaskType':
    return <NewTaskTypeForm {...commonProps} />;
```

3. Create a new form component for the task type in `src/components/enhanced/task/task/task_types/NewTaskTypeForm.tsx`:

```typescript
import React from 'react';
import { Box, TextField } from '@mui/material';
import { TaskFormsProps } from '../../../../../types/TaskTypes';

const NewTaskTypeForm: React.FC<TaskFormsProps> = ({
  item,
  onChange,
  mode,
  // ... other props
}) => {
  // Implement your form here
  return (
    <Box>
      {/* Add form fields specific to your new task type */}
    </Box>
  );
};

export default NewTaskTypeForm;
```

4. Update the `getDefaultTaskForm` function in `src/types/TaskTypes.ts` to include default values for your new task type:

```typescript
export const getDefaultTaskForm = (taskType: TaskType): AliceTask => {
  // ... existing cases
  case 'NewTaskType':
    return {
      ...baseForm,
      // Add any specific properties for your new task type
    };
  // ...
};
```

## Adding New API Types

To add support for a new API type in the frontend:

1. Update the `ApiType` enum in `src/types/ApiTypes.ts`:

```typescript
export enum ApiType {
  // ... existing types
  NEW_API = 'new_api',
}
```

2. Modify the `ApiFlexibleView` component in `src/components/enhanced/api/api/ApiFlexibleView.tsx` to include fields specific to your new API type:

```typescript
// In the render function:
{form.api_type === ApiType.NEW_API && (
  <TextField
    fullWidth
    label="New API Specific Field"
    value={form.api_config?.new_api_field || ''}
    onChange={(e) => handleApiConfigChange('new_api_field', e.target.value)}
    margin="normal"
    disabled={!isEditMode}
  />
)}
```

3. Update the `API_TYPE_CONFIGS` object in `src/utils/ApiUtils.ts`:

```typescript
export const API_TYPE_CONFIGS: Record<ApiType, ApiTypeConfig> = {
  // ... existing configs
  [ApiType.NEW_API]: {
    api_name: 'new_api',
    apiConfig: {
      new_api_field: '',
      // Add any other configuration fields needed for your new API type
    },
  },
};
```

4. If needed, update the `ApiCardView`, `ApiListView`, and `ApiTableView` components to properly display information about the new API type.

## Development

To start the development server:

1. Ensure all dependencies are installed: `npm install`
2. Start the development server: `npm start`

The application will be available at `http://localhost:4000` by default.

## Building for Production

To create a production build:

1. Run the build script: `npm run build`
2. The built files will be available in the `build` directory

## Testing

Run the test suite using:

```
npm test
```

## Contributing

Contributions are welcome! Please follow the project's coding standards and submit pull requests for any new features or bug fixes.

## Support

For any issues or questions related to the frontend container, please contact the development team or refer to the main project documentation.