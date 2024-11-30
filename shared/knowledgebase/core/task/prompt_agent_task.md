# Prompt Agent Tasks


Base task for LLM interactions implementing a sophisticated three-node pattern for handling various types of LLM responses. Distinguished by its ability to dynamically route between tool usage and code execution based on LLM output.

## Key Features
- Three-node execution pattern (llm → tools → code)
- Dynamic response analysis and routing
- Integrated tool and code handling
- Flexible template system

## Node Structure
1. `llm_generation`: Processes prompt and analyzes response
2. `tool_call_execution`: Handles any tool calls
3. `code_execution`: Executes any code blocks

## Usage
```python
class CustomAssistantTask(PromptAgentTask):
    def __init__(self):
        super().__init__(
            agent=agent_with_capabilities,
            task_name="smart_assistant",
            templates={
                "task_template": Prompt(
                    content="Solve this task: {{prompt}}"
                )
            }
        )
```

## Core Components

### Structure
```typescript
interface PromptAgentTask extends AliceTask {
    agent: AliceAgent;
    required_apis: [ApiType.LLM_MODEL];
    templates: {
        task_template: Prompt;   // For formatting agent input
        output_template: Prompt; // For formatting task output
    };
    start_node: 'llm_generation';
}
```

### Execution Flow
The task implements three main nodes:

1. **LLM Generation** (`llm_generation`)
   - Processes the input prompt
   - Analyzes output for tool calls and code
   - Determines execution path

2. **Tool Execution** (`tool_call_execution`)
   - Handles any tool/function calls
   - Can route to code execution

3. **Code Execution** (`code_execution`)
   - Processes code blocks
   - Returns execution results

## Exit Codes

### LLM Generation Exit Codes
```typescript
enum LLMExitCode {
    SUCCESS_NO_EXEC = 0,  // Success, no tools or code needed
    FAILURE = 1,          // Generation failed
    SUCCESS_TOOLS = 2,    // Has tool calls, no code
    SUCCESS_CODE = 3,     // Has code, no tool calls
    SUCCESS_BOTH = 4      // Has both tool calls and code
}
```

### Tool Execution Exit Codes
```typescript
enum ToolExitCode {
    SUCCESS = 0,         // Success, no code needed
    FAILURE = 1,         // Failed
    SUCCESS_CODE = 2     // Success, proceed to code
}
```

## Creating Prompt Agent Tasks

### Basic Task
```typescript
const basicPromptTask = new PromptAgentTask({
    task_name: "basic_analysis",
    task_description: "Analyze input and provide insights",
    agent: someAgent,
    templates: {
        task_template: new Prompt({
            content: "Analyze the following and provide insights: {prompt}",
            input_variables: ["prompt"]
        }),
        output_template: new Prompt({
            content: "Analysis Results:\n{llm_generation}",
            input_variables: ["llm_generation"]
        })
    }
});
```

### With Tool Access
```typescript
const toolEnabledTask = new PromptAgentTask({
    task_name: "research_assistant",
    task_description: "Research a topic using various tools",
    agent: researchAgent,
    templates: {
        task_template: new Prompt({
            content: "Research the following topic: {topic}",
            input_variables: ["topic"]
        })
    },
    tasks: {
        "search": googleSearchTask,
        "academic_search": arxivSearchTask
    }
});
```

### With Code Execution
```typescript
const codeExecutionTask = new PromptAgentTask({
    task_name: "data_processor",
    task_description: "Process data using generated code",
    agent: codeAgent,
    templates: {
        task_template: new Prompt({
            content: "Generate code to process this data: {data}",
            input_variables: ["data"]
        })
    },
    input_variables: {
        type: "object",
        properties: {
            data: {
                type: "string",
                description: "Data to process"
            },
            format: {
                type: "string",
                description: "Desired output format",
                default: "json"
            }
        },
        required: ["data"]
    }
});
```

## Routing Configuration

Default routing configuration:
```typescript
{
    'llm_generation': {
        LLMExitCode.SUCCESS_NO_EXEC: [null, false],
        LLMExitCode.FAILURE: ['llm_generation', true],
        LLMExitCode.SUCCESS_TOOLS: ['tool_call_execution', false],
        LLMExitCode.SUCCESS_CODE: ['code_execution', false],
        LLMExitCode.SUCCESS_BOTH: ['tool_call_execution', false]
    },
    'tool_call_execution': {
        ToolExitCode.SUCCESS: [null, false],
        ToolExitCode.FAILURE: ['tool_call_execution', true],
        ToolExitCode.SUCCESS_CODE: ['code_execution', false]
    },
    'code_execution': {
        0: [null, false],
        1: ['code_execution', true]
    }
}
```

## Best Practices

1. **Template Design**
   - Use clear, specific prompts
   - Include necessary context
   - Define proper input variables

2. **Tool Integration**
   - Only include relevant tools
   - Set appropriate permissions
   - Handle tool failures gracefully

3. **Code Execution**
   - Set proper security constraints
   - Handle timeouts appropriately
   - Validate code outputs

4. **Error Handling**
   - Use appropriate retry strategies
   - Provide clear error messages
   - Implement fallback behavior

5. **Performance**
   - Minimize unnecessary LLM calls
   - Use efficient routing
   - Cache results when appropriate