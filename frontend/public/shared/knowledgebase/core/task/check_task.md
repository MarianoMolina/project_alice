# CheckTask

A simplified version of PromptAgentTask designed for binary validation decisions. Uses a single LLM node to evaluate content against criteria.

## Key Features
- Single-node validation pattern
- Configurable response mapping
- Simple exit code structure
- Clear pass/fail outcomes

## Usage
```python
checker = CheckTask(
    agent=agent_with_llm,
    task_name="content_validator",
    templates={
        "task_template": Prompt(
            content="Evaluate this content: {{prompt}}\nRespond with APPROVED or FAILED."
        )
    }
)

result = await checker.run(
    prompt="Content to validate"
)
```