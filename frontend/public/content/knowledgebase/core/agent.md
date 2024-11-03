# Alice Agent

An Alice Agent is a fundamental component, designed to interact with users and perform various tasks. This document explains the key features and capabilities of an Alice Agent.
```User_prompt 
A representation of an AI agent
```
![Agent Represents An AI Agent](/content/img/ai_agent_represented_small.png)
```Agent_prompt
A futuristic representation of an AI agent. The image shows a sleek, translucent humanoid figure with circuitry and data streams visible within its form. The figure is positioned in a dynamic pose, reaching out with one hand. Its head is slightly oversized, featuring a network of glowing nodes representing neural connections. The background is a abstract digital landscape with flowing lines of code and pulsing energy. The color palette is dominated by cool blues and purples with accents of bright white and electric blue to represent energy and intelligence. The overall style is a blend of digital art and sci-fi concept illustration, creating a sense of advanced technology and artificial consciousness.
```

## Core Components

An Alice Agent is defined by three main components:

1. System Message Prompt
2. Model Dictionary
3. Capability Settings

```python
class AliceAgent(BaseDataStructure):
    id: Optional[str]
    name: str
    system_message: Prompt
    models: Dict[ModelType, Optional[AliceModel]]
    has_tools: ToolPermission
    has_code_exec: CodePermission
    max_consecutive_auto_reply: int
```

### 1. System Message Prompt

The system message prompt is a crucial element that sets the context and behavior for the agent. It provides initial instructions and guidelines that shape the agent's responses and actions throughout its interactions. For now, they can only use non-templated prompts. 

### 2. Model Dictionary

An agent has access to a dictionary of models, where each model is associated with a specific model type. This allows the agent to utilize different models for various tasks or types of interactions. The model dictionary is structured as follows:

```python
models: Dict[ModelType, Optional[AliceModel]] = {
    ModelType.CHAT: None,
    ModelType.INSTRUCT: None,
    ModelType.VISION: None,
    ModelType.IMG_GEN: None,
    ModelType.STT: None,
    ModelType.TTS: None,
    ModelType.EMBEDDINGS: None
}
```


1. **Text Generation** (CHAT/INSTRUCT)
   ```python
   async def generate_llm_response(
       self,
       api_manager: APIManager,
       messages: List[MessageDict],
       tools_list: List[ToolFunction] = []
   ) -> MessageDict
   ```

2. **Vision**
   ```python
   async def generate_vision_response(
       self,
       api_manager: APIManager,
       file_references: List[FileReference],
       prompt: str
   ) -> MessageDict
   ```

3. **Speech Processing**
   ```python
   async def generate_stt_response(
       self,
       api_manager: APIManager,
       file_reference: FileReference
   ) -> MessageDict

   async def generate_speech(
       self,
       api_manager: APIManager,
       input: str,
       voice: str = "nova",
       speed: float = 1.0
   ) -> List[FileContentReference]
   ```

4. **Image Generation**
   ```python
   async def generate_image(
       self,
       api_manager: APIManager,
       prompt: str,
       n: int = 1,
       size: str = "1024x1024",
       quality: str = "standard"
   ) -> FileContentReference
   ```

5. **Embeddings**
   ```python
   async def generate_embeddings(
       self,
       api_manager: APIManager,
       input: Union[str, List[str]],
       language: Optional[Language]
   ) -> List[EmbeddingChunk]
   ```

This flexible structure enables the agent to switch between different models (check [models](/knowledgebase/model) to see all the model types) based on the requirements of the task at hand. 

### 3. Capability Settings

The agent's behavior and abilities are further defined by several boolean flags and settings:

- `has_tools`: Determines whether the agent can use tools (tasks are tools).
```python
class ToolPermission(IntEnum):
    DISABLED = 0      # Tools cannot be used
    NORMAL = 1        # Tools can be used normally
    WITH_PERMISSION = 2  # Tools require user permission
    DRY_RUN = 3      # Tools can be called but not executed
```
- `has_code_exec`: Indicates if the agent is allowed to execute code blocks.
```python
class CodePermission(IntEnum):
    DISABLED = 0       # No code execution
    NORMAL = 1         # All valid code blocks are executed
    WITH_PERMISSION = 2 # Code requires user permission
    TAGGED_ONLY = 3    # Only blocks with _execute tag are executed
```
- `max_consecutive_auto_reply`: Controls the number of consecutive automated replies the agent can make. This setting is particularly important for controlling the agent's behavior in complex scenarios:
  - If set to 1 (default), the agent provides a single response to each user input.
  - If set to a value greater than 1, the agent can perform multiple actions in sequence:
    - It can execute tool calls or code, add the output to the conversation, and then provide another response.
    - If set to 2 or higher, the agent can continue this cycle, potentially using more tool calls or executing more code before giving a final response.

This feature allows for more sophisticated and autonomous behavior, enabling the agent to complete complex tasks with minimal user intervention.

## Usage Examples

### 1. Basic Chat Agent
```python
agent = AliceAgent(
    name="Basic Assistant",
    system_message=Prompt(
        content="You are a helpful assistant."
    ),
    has_tools=ToolPermission.DISABLED,
    has_code_exec=CodePermission.DISABLED
)

response = await agent.generate_llm_response(
    api_manager=api_manager,
    messages=[{
        "role": "user",
        "content": "Hello!"
    }]
)
```

### 2. Code-Enabled Agent
```python
agent = AliceAgent(
    name="Code Assistant",
    system_message=Prompt(
        content="You are a Python programming assistant."
    ),
    has_code_exec=CodePermission.TAGGED_ONLY,
    models={
        ModelType.CHAT: some_chat_model,
        ModelType.INSTRUCT: some_instruct_model
    }
)

# Agent can now execute tagged code blocks
```

### 3. Multi-Modal Agent
```python
agent = AliceAgent(
    name="Multi-Modal Assistant",
    system_message=Prompt(
        content="You can handle various types of media."
    ),
    models={
        ModelType.CHAT: chat_model,
        ModelType.VISION: vision_model,
        ModelType.STT: stt_model,
        ModelType.TTS: tts_model
    }
)

# Process image
vision_response = await agent.generate_vision_response(
    api_manager=api_manager,
    file_references=[image_file],
    prompt="Describe this image"
)

# Generate speech
audio_files = await agent.generate_speech(
    api_manager=api_manager,
    input="Hello, how are you?",
    voice="nova"
)
```

### 4. Tool-Using Agent
```python
agent = AliceAgent(
    name="Tool Assistant",
    system_message=Prompt(
        content="You can use various tools to help users."
    ),
    has_tools=ToolPermission.NORMAL
)

# Process tool calls
tool_responses = await agent.process_tool_calls(
    tool_calls=some_tool_calls,
    tool_map=tool_functions,
    tools_list=available_tools
)
```

## Best Practices

1. **Permission Management**
   - Set appropriate tool and code permissions
   - Use DRY_RUN for testing
   - Implement user permission checks

2. **Model Selection**
   - Configure models based on task requirements
   - Provide fallbacks for missing models
   - Monitor model performance

3. **Error Handling**
   - Implement proper error catching
   - Provide meaningful error messages
   - Log relevant debugging information

4. **Resource Management**
   - Monitor token usage
   - Implement rate limiting
   - Handle API quotas

5. **Security**
   - Validate all inputs
   - Isolate code execution
   - Monitor tool usage

## Common Patterns

### 1. Progressive Enhancement
```python
agent = AliceAgent(
    name="Progressive Assistant",
    system_message=base_prompt
)

# Add capabilities as needed
if needs_code:
    agent.has_code_exec = CodePermission.NORMAL
if needs_tools:
    agent.has_tools = ToolPermission.NORMAL
```

### 2. Specialized Agents
```python
code_agent = AliceAgent(
    name="Code Specialist",
    system_message=code_prompt,
    has_code_exec=CodePermission.NORMAL,
    models={
        ModelType.CHAT: code_optimized_model
    }
)

vision_agent = AliceAgent(
    name="Vision Specialist",
    system_message=vision_prompt,
    models={
        ModelType.VISION: vision_model,
        ModelType.CHAT: description_model
    }
)
```

### 3. Safe Execution
```python
agent = AliceAgent(
    name="Safe Assistant",
    system_message=Prompt(
        content="Safety-first assistant"
    ),
    has_tools=ToolPermission.WITH_PERMISSION,
    has_code_exec=CodePermission.TAGGED_ONLY
)
```