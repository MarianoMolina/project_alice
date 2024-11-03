# Tasks

Tasks are the core execution units in the Alice system, representing specific operations that can be performed by agents or triggered within chats. The task system uses a node-based execution model that enables complex workflows and flexible routing based on execution results.

## Core Task Components

### Base Task Structure
Each task in the system contains:

1. **Basic Information**
   - `task_name`: Name identifier for the task
   - `task_description`: Clear description of the task's purpose
   - `task_type`: Type of task (automatically determined by class)

2. **Execution Control**
   - `start_node`: Starting node for execution
   - `recursive`: Whether task can be executed recursively
   - `max_attempts`: Maximum attempts per node before failure
   - `timeout`: Optional task timeout in seconds

3. **Input/Output Configuration**
   - `input_variables`: Expected input structure using FunctionParameters
   - `exit_codes`: Possible outcome codes and their descriptions
   - `templates`: Prompt templates for input/output formatting

4. **Node Configuration**
   - `node_end_code_routing`: Rules for routing between nodes based on exit codes
   - `user_checkpoints`: Node-specific user interaction points
   - `required_apis`: Required API types for task execution

## Node-Based Execution Model

Tasks use a node-based execution model where:

1. Each task consists of one or more named nodes (execution steps)
2. Nodes are executed sequentially based on routing rules
3. Each node execution produces a NodeResponse containing:
   - Exit code indicating success/failure
   - References (messages, task responses, files, etc.)
   - Execution metadata

### Node Routing
```typescript
type RouteMapTuple = [string | null, boolean];
type RouteMap = { [key: number]: RouteMapTuple };
type TasksEndCodeRouting = { [key: string]: RouteMap };
```

The routing system uses:
- Exit codes to determine next steps
- Boolean flags to indicate whether to retry nodes
- Null next-node values to indicate task completion

Example routing configuration:
```typescript
{
  'node1': {
    0: [null, false],     // Success, end task
    1: ['node1', true],   // Failure, retry node
    2: ['node2', false]   // Success with condition, go to node2
  }
}
```

## Task Response Structure

Tasks generate responses containing:
```typescript
interface TaskResponse {
    task_id: string;
    task_name: string;
    task_description: string;
    status: 'pending' | 'complete' | 'failed';
    result_code: number;
    task_outputs?: string;
    references?: References;
    task_inputs?: { [key: string]: any };
    result_diagnostic?: string;
    node_references: NodeResponse[];
    execution_history?: ExecutionHistoryItem[];
}
```

## User Interactions

Tasks can define checkpoints where user input is required:
```typescript
interface UserCheckpoint {
    id: string;
    task_next_obj: { [key: string]: string };
    // Additional checkpoint configuration
}
```

## Core Task Types

Alice provides three primary task types:

1. **PromptAgentTask**: Tasks that use AI agents to process prompts and potentially execute code or tools
2. **APITask**: Tasks that interact with specific external APIs
3. **Workflow**: Tasks that orchestrate multiple subtasks in a defined sequence

Each type implements the base task structure while adding specialized functionality for its specific use case.

## Using Tasks

Tasks can be used in several ways:

1. **Direct Execution**
```typescript
const response = await task.run({
    prompt: "Your input here",
    api_manager: apiManagerInstance,
    // Additional parameters as needed
});
```

2. **In Chats**
```typescript
// Add task to chat for agent use
chat.functions = [task];
```

3. **In Workflows**
```typescript
const workflow = new Workflow({
    tasks: {
        "step1": task1,
        "step2": task2
    },
    // Workflow configuration
});
```

## Best Practices

1. **Input Validation**: Always define clear input_variables with proper types and descriptions
2. **Error Handling**: Use appropriate exit codes and diagnostics for error conditions
3. **Node Design**: Keep node functionality focused and single-purpose
4. **Routing Logic**: Design routing to handle both success and failure cases
5. **User Interaction**: Use user checkpoints for critical decision points requiring human input

## Common Patterns

1. **Sequential Processing**
```typescript
{
  'start': {
    0: ['process', false],
    1: ['start', true]
  },
  'process': {
    0: ['validate', false],
    1: ['process', true]
  },
  'validate': {
    0: [null, false],
    1: ['validate', true]
  }
}
```

2. **Conditional Branching**
```typescript
{
  'analyze': {
    0: ['success_path', false],
    1: ['error_path', false],
    2: ['alternate_path', false]
  }
}
```

3. **Retry Logic**
```typescript
{
  'node1': {
    0: [null, false],
    1: ['node1', true]  // Retry on failure
  }
}
```