# Tasks

Tasks in Alice represent specific operations or workflows that can be executed by agents or triggered within chats. They encompass a wide range of functionalities, from simple API calls to complex multi-step processes.

## Task Types

The Alice system supports various task types, each designed for specific purposes:

```typescript
export type TaskType = "CVGenerationTask" | "RedditSearchTask" | "APITask" | "WikipediaSearchTask" | "GoogleSearchTask" | "ExaSearchTask" | "ArxivSearchTask" | "PromptAgentTask" | "CheckTask" | "CodeGenerationLLMTask" | "CodeExecutionLLMTask" | "Workflow" | "EmbeddingTask" | "GenerateImageTask" | "TextToSpeechTask" | "WebScrapeBeautifulSoupTask";
```

These task types cover a broad spectrum of functionalities, including search operations, code generation and execution, text-to-speech conversion, and more.

## Task Structure

Each task in the system is represented by the `AliceTask` interface:

```typescript
export interface AliceTask extends BaseDataseObject {
  _id?: string;
  task_name: string;
  task_description: string;
  task_type: TaskType;
  input_variables: FunctionParameters | null;
  exit_codes: { [key: string]: string };
  recursive: boolean;
  templates: { [key: string]: Prompt | null };
  tasks: { [key: string]: AliceTask };
  valid_languages: string[];
  timeout: number | null;
  prompts_to_add: { [key: string]: Prompt } | null;
  exit_code_response_map: { [key: string]: number } | null;
  start_task?: string | null;
  required_apis?: ApiType[] | null;
  model_id: AliceModel | null;
  task_selection_method?: CallableFunction | null;
  tasks_end_code_routing?: TasksEndCodeRouting | null;
  max_attempts?: number;
  agent?: AliceAgent | null;
  human_input?: boolean;
  api_engine?: APIEngine | null;
}
```

Key properties:
- `task_name` and `task_description`: Identify and describe the task
- `task_type`: Specifies the category of the task
- `input_variables`: Defines the expected inputs for the task
- `exit_codes`: Possible outcomes of the task execution
- `tasks`: Subtasks for complex workflows
- `model_id`: The AI model used for this task (if applicable)
- `agent`: The agent assigned to execute this task (if applicable)

## Task Functionality

In the frontend, tasks provide the following functionality:

1. **Task Creation and Editing**: Users can create new tasks or edit existing ones, configuring all relevant properties.

2. **Task Execution**: Tasks can be executed individually or as part of a chat conversation.

3. **Workflow Management**: Complex tasks (Workflow type) can be created by combining multiple subtasks.

4. **Integration with APIs and Models**: Tasks can be configured to use specific APIs and AI models.

5. **Error Handling and Retries**: The `max_attempts` property allows for automatic retries in case of failures.

## User Interface Considerations

When designing interfaces for task management, consider:

1. Clear categorization of tasks by type
2. Intuitive input forms for configuring task properties
3. Visual representation of workflow tasks and their subtasks
4. Easy access to execution history and results
5. Integration with the chat interface for task execution within conversations

## Task Routing and Workflows

The `tasks_end_code_routing` property allows for complex decision-making based on task outcomes:

```typescript
export type RouteMapTuple = [string | null, boolean];
export type RouteMap = { [key: number]: RouteMapTuple };
export type TasksEndCodeRouting = { [key: string]: RouteMap };
```

This structure enables the creation of dynamic workflows where the next step is determined by the outcome of the current task.

Understanding the structure and functionality of tasks is crucial for effectively managing and utilizing the diverse capabilities of the Alice system.