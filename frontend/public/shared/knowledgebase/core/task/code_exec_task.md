# CodeExecutionLLMTask

A focused implementation of PromptAgentTask that handles only code execution. Uses a single node to manage code execution environments and outputs.

## Key Features
- Single 'code_execution' node
- Multiple language support
- Execution environment management
- Structured output capture

## Usage
```python
code_exec = CodeExecutionLLMTask(
    agent=agent_with_code_exec,
    task_name="code_runner",
    task_description="Execute code safely"
)

result = await code_exec.run(
    prompt="Code to execute",
```

---