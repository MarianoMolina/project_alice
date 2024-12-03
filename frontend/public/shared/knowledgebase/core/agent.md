# Alice Agent

An Alice Agent is a fundamental component, designed to interact with users and perform various tasks. This document explains the key features and capabilities of an Alice Agent.
```User_prompt 
A representation of an AI agent
```
![Agent Represents An AI Agent](../../img/random/ai_agent_represented_small.png)
```Agent_prompt
A futuristic representation of an AI agent. The image shows a sleek, translucent humanoid figure with circuitry and data streams visible within its form. The figure is positioned in a dynamic pose, reaching out with one hand. Its head is slightly oversized, featuring a network of glowing nodes representing neural connections. The background is a abstract digital landscape with flowing lines of code and pulsing energy. The color palette is dominated by cool blues and purples with accents of bright white and electric blue to represent energy and intelligence. The overall style is a blend of digital art and sci-fi concept illustration, creating a sense of advanced technology and artificial consciousness.
```

## Core Components

The AliceAgent is a configurable AI assistant that serves as a bridge between your applications and various AI models and capabilities. At its core, an AliceAgent maintains:

1. **Model Configuration**
   - A dictionary of models for different capabilities (chat, vision, speech, etc.)
   - Each model type (CHAT, VISION, STT, TTS, EMBEDDINGS, IMG_GEN) can have one assigned model
   - At least one model (either CHAT or INSTRUCT) is required for basic functionality

2. **System Message**
   - Defines the agent's base behavior and role
   - Can include special instructions for tool usage and code execution
   - Dynamically updated based on agent permissions and capabilities

3. **Permission Settings**
   - Tool Permissions: Controls the agent's ability to use external functions
     - DISABLED: No tool usage
     - NORMAL: Unrestricted tool usage
     - WITH_PERMISSION: Requires user confirmation
     - DRY_RUN: Simulates tool calls without execution
   
   - Code Execution Permissions: Controls the agent's ability to run code
     - DISABLED: No code execution
     - NORMAL: Executes all code blocks
     - WITH_PERMISSION: Requires user confirmation
     - TAGGED_ONLY: Only executes specially marked code blocks

```python
# Example of a fully configured agent
agent = AliceAgent(
    name="multipurpose_assistant",
    # Model configuration for various capabilities
    models={
        ModelType.CHAT: chat_model,      # For conversation
        ModelType.VISION: vision_model,   # For image analysis
        ModelType.TTS: tts_model,        # For speech generation
        ModelType.STT: stt_model,        # For speech recognition
        ModelType.EMBEDDINGS: emb_model,  # For text embeddings
        ModelType.IMG_GEN: img_model     # For image generation
    },
    # Base behavior definition
    system_message=Prompt(
        content="You are a versatile assistant capable of various tasks..."
    ),
    # Permission configuration
    has_tools=ToolPermission.NORMAL,
    has_code_exec=CodePermission.TAGGED_ONLY,
    max_consecutive_auto_reply=1
)
```

The agent processes all interactions through a message-based architecture, where each interaction (whether it's a simple text response, a tool call, or code execution) is wrapped in a MessageDict structure. This ensures consistent handling and storage of all operations, and allows the agent to:

- Generate text responses using language models
- Analyze and generate images
- Process and generate speech
- Execute code in various programming languages
- Use tools to access external functionality
- Generate text embeddings for semantic operations

When used in applications, agents can be employed in two main contexts:
1. **Chat Environments**: Direct interaction with users, where permissions directly control available capabilities
2. **Task Workflows**: As components of larger processes, where their permissions determine which task nodes can be executed

```python
# Minimal agent for safe chat environments
chat_agent = AliceAgent(
    name="safe_chat_assistant",
    models={ModelType.CHAT: chat_model},
    system_message=Prompt(content="You are a helpful chat assistant"),
    has_tools=ToolPermission.DISABLED,
    has_code_exec=CodePermission.DISABLED
)

# Task-oriented agent with full capabilities
task_agent = AliceAgent(
    name="workflow_assistant",
    models={
        ModelType.CHAT: chat_model,
        ModelType.EMBEDDINGS: emb_model
    },
    system_message=Prompt(content="You are a workflow automation assistant"),
    has_tools=ToolPermission.NORMAL,
    has_code_exec=CodePermission.NORMAL
)
```

## Core Capabilities

### Message Generation
At its core, an AliceAgent can generate responses using various language models. This includes:
- Text generation for conversations and tasks
- Vision responses for image analysis
- Speech transcription and generation
- Image generation from text descriptions
- Text embedding generation

```python
# Basic agent setup for chat
chat_agent = AliceAgent(
    name="chat_assistant",
    system_message=Prompt(content="You are a helpful chat assistant"),
    models={
        ModelType.CHAT: chat_model,  # e.g., GPT-4
        ModelType.VISION: vision_model  # e.g., GPT-4V
    },
    has_tools=ToolPermission.DISABLED,
    has_code_exec=CodePermission.DISABLED
)

# Generate a simple response
response = await chat_agent.generate_llm_response(
    api_manager=api_manager,
    messages=[MessageDict(content="Tell me a joke")]
)
```

### Tool Usage
Agents can be granted permission to use tools (functions they can call). This enables them to:
- Query external data sources
- Perform calculations
- Execute specific operations
- Integrate with other systems

```python
# Agent with tool permissions
tool_enabled_agent = AliceAgent(
    name="research_assistant",
    system_message=Prompt(content="You are a research assistant with access to various tools"),
    models={ModelType.CHAT: chat_model},
    has_tools=ToolPermission.NORMAL,
    has_code_exec=CodePermission.DISABLED
)

# The agent can now use tools in its responses
response = await tool_enabled_agent.generate_llm_response(
    api_manager=api_manager,
    messages=[MessageDict(content="What's the weather in London?")],
    tools_list=[weather_tool]  # Tool must be provided to be available
)
```

### Code Execution
Agents can be configured to execute code, with different levels of permission:
- NORMAL: Execute all code blocks
- TAGGED_ONLY: Only execute specially marked code blocks
- WITH_PERMISSION: Request user permission before execution
- DISABLED: No code execution allowed

```python
# Agent that can execute code
coding_agent = AliceAgent(
    name="coding_assistant",
    system_message=Prompt(content="You are a coding assistant that can run Python code"),
    models={ModelType.CHAT: chat_model},
    has_tools=ToolPermission.DISABLED,
    has_code_exec=CodePermission.TAGGED_ONLY
)

# The agent can now execute code in its responses
response = await coding_agent.generate_llm_response(
    api_manager=api_manager,
    messages=[MessageDict(content="Write and run a function that calculates factorial")]
)
```

## Usage in Tasks vs Chats

### Chat Usage
In chats, agents interact directly with users in real-time. Their permissions directly determine what they can and cannot do:
- An agent without tool permissions cannot use tools
- An agent without code execution permissions cannot run code
- All operations require appropriate model configurations

### Task Usage
In tasks, agents are components of a larger workflow. Their permissions affect how task nodes behave:
- Tasks with tool call nodes require agents with tool permissions
- Code execution nodes require agents with code execution permissions
- Nodes will be skipped if the agent lacks necessary permissions

```python
# Agent for a task that requires both tools and code execution
task_agent = AliceAgent(
    name="workflow_agent",
    system_message=Prompt(content="You are a workflow assistant"),
    models={
        ModelType.CHAT: chat_model,
        ModelType.EMBEDDINGS: embedding_model
    },
    has_tools=ToolPermission.NORMAL,
    has_code_exec=CodePermission.NORMAL
)
```

## Best Practices

1. **Permission Matching**
   - Ensure agent permissions match intended use
   - Create separate agents for different permission requirements
   - Don't give more permissions than needed

2. **Model Configuration**
   - Only configure models that will be used
   - Ensure models match the agent's purpose
   - Consider model capabilities when setting permissions

3. **System Messages**
   - Make system messages specific to the agent's role
   - Include permission context in system messages
   - Update system messages when changing permissions

```python
# Example of two agents with same base configuration but different permissions
base_config = {
    "name": "assistant",
    "models": {ModelType.CHAT: chat_model},
    "system_message": Prompt(content="You are a helpful assistant")
}

# Safe agent for general chat
safe_agent = AliceAgent(
    **base_config,
    has_tools=ToolPermission.DISABLED,
    has_code_exec=CodePermission.DISABLED
)

# Full-access agent for trusted environments
full_agent = AliceAgent(
    **base_config,
    has_tools=ToolPermission.NORMAL,
    has_code_exec=CodePermission.NORMAL
)
```

## Common Issues and Solutions

1. **Missing Permissions**
   - Issue: Task nodes not executing
   - Solution: Check agent permissions match task requirements

2. **Model Misconfigurations**
   - Issue: Features not working (vision, speech, etc.)
   - Solution: Ensure required models are configured in agent

3. **Permission Conflicts**
   - Issue: Unexpected behavior in tools/code execution
   - Solution: Create separate agents with specific permission sets