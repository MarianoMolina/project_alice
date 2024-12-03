# Alice Task System

The Alice Task System provides a flexible, node-based execution framework for implementing complex workflows with AI assistance. At its core is the `AliceTask` base class, which implements a sophisticated execution model where tasks are broken down into nodes that execute in sequence based on configurable routing rules.

## Core Concepts

### Node-Based Execution
Tasks in Alice are built around the concept of nodes - discrete units of execution that can be chained together. Each node:
- Has a specific purpose and execution logic
- Returns structured responses with exit codes
- Can be routed to other nodes based on results
- Maintains execution history for tracking and recovery

### Task Structure
Every task consists of:
- One or more execution nodes
- Routing rules between nodes
- Input/output specifications
- API requirements
- Optional user checkpoints

### Task Response Flow
Tasks follow a standard execution pattern:
1. Validate inputs and API availability
2. Execute nodes in sequence based on routing rules
3. Handle user interactions when encountered
4. Generate structured responses with execution history

## Creating Custom Tasks

### Basic Task Template
```python
class CustomTask(AliceTask):
    def __init__(self):
        super().__init__(
            task_name="custom_task",
            task_description="Description of what this task does",
            node_end_code_routing={
                'first_node': {
                    0: ('second_node', False),  # Success, move to second_node
                    1: ('first_node', True)     # Failure, retry first_node
                },
                'second_node': {
                    0: (None, False),           # Success, end task
                    1: ('second_node', True)    # Failure, retry second_node
                }
            }
        )

    async def execute_first_node(
        self, 
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        # Implement first node logic
        return NodeResponse(...)

    async def execute_second_node(
        self, 
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs
    ) -> NodeResponse:
        # Implement second node logic
        return NodeResponse(...)
```

### Best Practices

1. **Node Design**
   - Keep nodes focused on single responsibilities
   - Use clear, descriptive node names
   - Handle errors appropriately within nodes
   - Document exit codes and their meanings

2. **Routing Logic**
   - Plan your node sequence carefully
   - Consider retry scenarios
   - Document routing conditions
   - Use meaningful exit codes

3. **Input/Output**
   - Define clear input parameters
   - Validate inputs thoroughly
   - Structure outputs consistently
   - Use appropriate templates

### Common Patterns

1. **Single-Node Tasks**
```python
class SimpleTask(AliceTask):
    def __init__(self):
        super().__init__(
            task_name="simple_task",
            node_end_code_routing={
                'process': {
                    0: (None, False),    # Success
                    1: ('process', True)  # Retry
                }
            }
        )

    async def execute_process(self, execution_history, node_responses, **kwargs):
        # Implementation
        pass
```

2. **Linear Multi-Node Tasks**
```python
class LinearTask(AliceTask):
    def __init__(self):
        super().__init__(
            task_name="linear_task",
            node_end_code_routing={
                'fetch': {
                    0: ('process', False),
                    1: ('fetch', True)
                },
                'process': {
                    0: ('save', False),
                    1: ('process', True)
                },
                'save': {
                    0: (None, False),
                    1: ('save', True)
                }
            }
        )
```

3. **Conditional Branching**
```python
class BranchingTask(AliceTask):
    def __init__(self):
        super().__init__(
            task_name="branching_task",
            node_end_code_routing={
                'check': {
                    0: ('success_path', False),
                    1: ('failure_path', False)
                },
                'success_path': {
                    0: (None, False),
                    1: ('success_path', True)
                },
                'failure_path': {
                    0: (None, False),
                    1: ('failure_path', True)
                }
            }
        )
```

## Task Types Overview

### Core Tasks

# Task Type Quick Reference

## Single-Node Tasks
- **TextToSpeechTask**: Audio generation [Link](/shared/knowledgebase/core/task/text_to_speech_task.md)

    Converts text to speech using AI models. Single-node implementation with voice selection and speed adjustment capabilities.

- **EmbeddingTask**: Vector embeddings [Link](/shared/knowledgebase/core/task/embedding_task.md)

    Generates vector representations of text. Single-node task with language-specific embedding generation and batch processing support.
- **GenerateImageTask**: Image creation

    Creates images from text descriptions. Single-node implementation supporting multiple sizes, quality settings, and batch generation.

- **CheckTask**: Content validation [Link](/shared/knowledgebase/core/task/check_task.md)

    Simple validation task using LLM responses. Single-node pattern looking for specific approval/failure strings. Perfect for content moderation or quality checks.

- **CodeExecutionLLMTask**: Code execution [Link](/shared/knowledgebase/core/task/code_exec_task.md)

    Focused task for executing code from LLM responses. Uses single-node pattern with comprehensive language support and execution environment management.

## Two-Node Tasks
- **CodeGenerationLLMTask**: Code generation and testing [Link](/shared/knowledgebase/core/task/code_gen_task.md)

    Two-node task for generating and testing code solutions. Implements feedback loop between generation and execution with robust error handling.

- **RetrievalTask**: Embedding maintenance and search [Link](/shared/knowledgebase/core/task/retrieval_task.md)

    Two-node task for managing and querying embedded content. Handles embedding maintenance and similarity-based retrieval with configurable thresholds.


## Three-Node Tasks
- **PromptAgentTask**: Full LLM interaction pattern [Link](/shared/knowledgebase/core/task/prompt_agent_task.md)

    Base class for LLM interactions with three-node pattern (LLM generation → tool execution → code execution.md). Provides sophisticated handling of LLM responses including tool calls and code execution.
    
- **WebScrapeBeautifulSoupTask**: Intelligent web scraping [Link](/shared/knowledgebase/core/task/web_scrape_task.md)

    Three-node task combining traditional web scraping with AI assistance. Uses LLM for selector generation and content summarization with robust fallback strategies.

## Special Patterns
- **APITask**: Single-node API interaction [Link](/shared/knowledgebase/core/task/api_task.md)

    Single-node task designed for direct API interactions. Handles validation, retries, and response formatting for any API type. Perfect for simple API operations with built-in error handling.
    
- **Workflow**: Multi-task orchestration [Link](/shared/knowledgebase/core/task/workflow.md)

    Orchestrates multiple tasks as nodes in a sequence. Manages variable passing between tasks and provides high-level workflow control. Ideal for complex processes involving multiple operations.

## Error Handling

Tasks should implement comprehensive error handling:

1. **Node-Level Errors**
   - Return appropriate exit codes
   - Include error details in NodeResponse
   - Use retry mechanics when appropriate

2. **Task-Level Errors**
   - Validate inputs before execution
   - Check API availability
   - Handle user interaction timeouts

3. **Recovery Strategies**
   - Implement retry logic
   - Use fallback approaches
   - Maintain execution state

## Best Practices for Task Development

1. **Planning**
   - Map out node sequence
   - Define clear success/failure conditions
   - Document routing logic
   - Plan error handling strategy

2. **Implementation**
   - Follow single responsibility principle
   - Implement thorough validation
   - Use meaningful exit codes
   - Document node behaviors

3. **Testing**
   - Test each node independently
   - Verify routing logic
   - Test error handling
   - Check retry behavior

4. **Documentation**
   - Document node purposes
   - Explain routing conditions
   - List exit codes
   - Provide usage examples