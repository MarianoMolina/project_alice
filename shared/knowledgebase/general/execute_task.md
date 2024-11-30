# Executing Tasks

Project Alice provides a powerful task execution interface for running various AI and data processing tasks. This guide will walk you through the main features and how to use them effectively.

## Accessing the Task Execution Interface

1. Navigate to the StartTask page in the application.
2. You'll see a sidebar on the left, the main task execution area in the center, and an API status and recent executions panel on the right.

## Selecting or Creating

### Selecting an Existing Task
1. In the sidebar, make sure the `Task` tab is selected.
2. You'll see a list of available [tasks](/shared/knowledgebase/core/task/task).
3. Use the filter at the top to narrow down tasks by their type (e.g., APITask, PromptAgentTask, CodeGenerationLLMTask).
4. Click on a task to load it in the main execution area.

### Creating a New Task
1. Click the `Create task` button (with a '+' icon) at the top of the sidebar.
2. Follow the prompts to set up your new task, including selecting the task type and configuring its parameters, which will largely depend on the type. 

## Executing

1. Once you've selected a task, you'll see its details and input fields in the main execution area.
2. Fill in the required input fields for the task.
3. Click the `Execute` button to run the task.
4. The results will appear in the main area once the task is complete.

## Viewing Recent Executions

1. On the right side of the interface, you'll find an `Recent Executions` accordion.
2. Expand this section to see a list of your recently executed tasks' [task responses](/shared/knowledgebase/core/task_response).
3. Click on any recent execution to view its details or load its inputs for re-execution.

## Checking API Status

1. At the top-right of the interface, you'll find an "[API](/shared/knowledgebase/core//api) Status" section.
2. This area provides a quick overview of the status of various APIs available and their current status.
3. Click on an API to view more details or troubleshoot any issues.

## Tips for Effective Task Execution

- Choose the appropriate task type for your needs. Each task type is designed for specific operations.
- Ensure all required inputs are filled correctly before executing a task.
- Use the task type filter in the sidebar to quickly find the kind of task you need.
- Review recent executions to learn from past results or quickly re-run tasks with slight modifications.
- Keep an eye on the API status to ensure all necessary services are operational for your tasks.
- For complex operations, consider creating a workflow that combines multiple tasks.