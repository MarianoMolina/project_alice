import pytest
from unittest.mock import Mock, AsyncMock
from workflow_logic.core.agent import AliceAgent
from workflow_logic.core.api import LLMEngine
from workflow_logic.core.prompt import Prompt
from workflow_logic.core.communication import MessageDict, SearchOutput, SearchResult
import unittest

@pytest.fixture
def mock_llm_engine():
    engine = AsyncMock(spec=LLMEngine)
    engine.generate_api_response.return_value = SearchOutput(content=[
        SearchResult(
            title="LLM Response",
            content="This is a test response",
            metadata={
                "model": "gpt-3.5-turbo",
                "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
                "cost": 0.0001
            }
        )
    ])
    return engine

@pytest.fixture
def mock_alice_agent():
    agent = Mock(spec=AliceAgent)
    agent.name = "TestAgent"
    agent.system_message = Prompt(name="Test", content="You are a test AI assistant.")
    agent.model_id = Mock(model_name="gpt-3.5-turbo")
    return agent

@pytest.mark.asyncio
async def test_chat_execution_take_turn(chat_execution):
    initial_messages = [MessageDict(role="user", content="Hello, AI!")]
    new_messages, is_terminated = await chat_execution.take_turn(initial_messages)
    
    assert len(new_messages) == 1
    assert new_messages[0]["role"] == "assistant"
    assert new_messages[0]["content"] == "This is a test response"
    assert not is_terminated

@pytest.mark.asyncio
async def test_chat_execution_with_function_call(chat_execution, mock_llm_engine):
    mock_llm_engine.generate_api_response.return_value = SearchOutput(content=[
        SearchResult(
            title="LLM Response",
            content="Calling a function",
            metadata={
                "model": "gpt-3.5-turbo",
                "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
                "cost": 0.0001,
                "tool_calls": [{"function": {"name": "test_function", "arguments": '{"arg": "value"}'}}]
            }
        )
    ])
    
    chat_execution.execution_agent.execute_function = AsyncMock(return_value=(True, {"content": "Function result"}))
    
    initial_messages = [MessageDict(role="user", content="Call a function")]
    new_messages, is_terminated = await chat_execution.take_turn(initial_messages)
    
    assert len(new_messages) == 2
    assert new_messages[0]["role"] == "assistant"
    assert new_messages[0]["content"].startswith("Calling tool")
    assert new_messages[1]["role"] == "tool"
    assert new_messages[1]["content"] == "Function result"
    assert not is_terminated

@pytest.mark.asyncio
async def test_chat_execution_with_code_execution(chat_execution, mock_llm_engine):
    mock_llm_engine.generate_api_response.return_value = SearchOutput(content=[
        SearchResult(
            title="LLM Response",
            content="Here's some Python code:\n```python\nprint('Hello, World!')\n```",
            metadata={
                "model": "gpt-3.5-turbo",
                "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
                "cost": 0.0001
            }
        )
    ])
    
    chat_execution.code_execution_config = True
    chat_execution.execution_agent.execute_code_blocks = Mock(return_value=(True, "Hello, World!"))
    
    initial_messages = [MessageDict(role="user", content="Write a Hello World program")]
    new_messages, is_terminated = await chat_execution.take_turn(initial_messages)
    
    assert len(new_messages) == 2
    assert new_messages[0]["role"] == "assistant"
    assert "Here's some Python code:" in new_messages[0]["content"]
    assert new_messages[1]["role"] == "tool"
    assert new_messages[1]["content"] == "Code execution result: Hello, World!"
    assert not is_terminated

@pytest.mark.asyncio
async def test_chat_execution_multi_turn_conversation(chat_execution, mock_llm_engine):
    mock_llm_engine.generate_api_response.side_effect = [
        SearchOutput(content=[SearchResult(title="LLM Response", content="Hello! How can I assist you today?", metadata={})]),
        SearchOutput(content=[SearchResult(title="LLM Response", content="The weather in New York is sunny today.", metadata={})]),
        SearchOutput(content=[SearchResult(title="LLM Response", content="You're welcome! Is there anything else I can help with? TERMINATE", metadata={})])
    ]
    
    conversation = await chat_execution.chat("Hi, what's the weather in New York?", max_turns=3)
    
    assert len(conversation) == 4
    assert conversation[0]["role"] == "user"
    assert conversation[1]["role"] == "assistant"
    assert conversation[2]["role"] == "user"
    assert conversation[3]["role"] == "assistant"
    assert "TERMINATE" in conversation[-1]["content"]
    
if __name__ == '__main__':
    unittest.main()
