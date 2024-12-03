# CodeGenerationLLMTask

A specialized variant of PromptAgentTask focused on code generation and testing. Implements a two-node pattern optimized for code-related tasks.

## Key Features
- Two-node pattern (generation → execution)
- Code-focused LLM prompting
- Built-in testing capabilities
- Generation-execution feedback loop

## Node Structure
1. `llm_generation`: Generates code solutions
2. `code_execution`: Tests generated code

## Usage
```python
task = CodeGenerationLLMTask(
    agent=coding_agent,
    task_name="code_generator",
    templates={
        "task_template": Prompt(
            content="Generate code to: {{prompt}}"
        )
    }
)
```
