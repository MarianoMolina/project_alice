import pytest
from typing import List
from unittest.mock import Mock, AsyncMock
from workflow_logic.core import Prompt, AliceModel, APIManager, AliceAgent
from workflow_logic.core.data_structures import MessageDict, ToolFunction, FunctionConfig, FunctionParameters, ParameterDefinition

@pytest.fixture
def mock_api_manager():
    return Mock(spec=APIManager)

@pytest.fixture
def sample_agent():
    return AliceAgent(
        name="TestAgent",
        system_message=Prompt(name="test", content="You are a test assistant"),
        models= {"chat": AliceModel(short_name="TestModel", model_name="test-model", model_format="OpenChat", ctx_size=1000, model_type="chat", deployment="test")},
        has_functions=True,
        has_code_exec=False,
        max_consecutive_auto_reply=5
    )

@pytest.mark.asyncio
async def test_generate_response_basic(sample_agent, mock_api_manager):
    mock_api_manager.generate_response_with_api_engine = AsyncMock(return_value={
        "content": "Test response",
        "tool_calls": None
    })
    
    messages = [MessageDict(role="user", content="Hello")]
    result: List[MessageDict] = await sample_agent.generate_response(mock_api_manager, messages)
    
    assert isinstance(result, list), f"Expected result to be a list, but got {type(result)}"
    assert len(result) == 1, f"Expected 1 message in result, but got {len(result)}"
    assert isinstance(result[0], dict), f"Expected result[0] to be a dict, but got {type(result[0])}"
    assert result[0].role == "assistant", f"Expected role to be 'assistant', but got {result[0].role}"
    assert result[0].content == "Test response", f"Expected content to be 'Test response', but got {result[0].content}"
    assert result[0].generated_by == "llm", f"Expected generated_by to be 'llm', but got {result[0].generated_by}"

@pytest.mark.asyncio
async def test_generate_response_with_tool_call(sample_agent, mock_api_manager):
    mock_api_manager.generate_response_with_api_engine = AsyncMock(return_value={
        "content": "API response content",
        "tool_calls": [{
            "function": {
                "name": "test_function",
                "arguments": '{"arg1": "value1", "arg2": 42}'
            }
        }]
    })
    
    async def test_function(arg1: str, arg2: int):
        return f"Function result: {arg1}, {arg2}"

    tool_map = {"test_function": test_function}
    tools_list = [ToolFunction(function=FunctionConfig(
        name="test_function",
        description="Test function",
        parameters=FunctionParameters(
            type="object",
            properties={
                "arg1": ParameterDefinition(type="string", description="Test string argument"),
                "arg2": ParameterDefinition(type="integer", description="Test integer argument")
            },
            required=["arg1", "arg2"]
        )
    ))]
    
    messages = [MessageDict(role="user", content="Use test function")]
    result: List[MessageDict] = await sample_agent.generate_response(mock_api_manager, messages, tool_map, tools_list)
    
    print(f'Result: {result}')
    assert isinstance(result, list), f"Expected result to be a list, but got {type(result)}"
    assert len(result) == 2, f"Expected 2 messages in result, but got {len(result)}"
    assert result[0].role == "assistant", f"Expected first message role to be 'assistant', but got {result[0].role}"
    assert result[0].content == "API response content", f"Expected first message content to be 'API response content', but got {result[0].content}"
    assert result[0].tool_calls is not None, f"Expected tool_calls to be present in the first message"
    assert result[1].role == "tool", f"Expected second message role to be 'tool', but got {result[1].role}"
    assert result[1].content == "Function result: value1, 42", f"Expected second message content to be 'Function result: value1, 42', but got {result[1].content}"

@pytest.mark.asyncio
async def test_generate_response_recursion_limit(sample_agent, mock_api_manager):
    mock_api_manager.generate_response_with_api_engine = AsyncMock(return_value={
        "content": "API response",
        "tool_calls": [{
            "function": {
                "name": "test_function",
                "arguments": '{}'
            }
        }]
    })
    
    async def test_function():
        return "Function called"

    tool_map = {"test_function": test_function}
    tools_list = [ToolFunction(function=FunctionConfig(
        name="test_function",
        description="Test function",
        parameters=FunctionParameters(
            type="object",
            properties={},
            required=[]
        )
    ))]
    
    messages = [MessageDict(role="user", content="Start recursion")]
    result: List[MessageDict]  = await sample_agent.generate_response(mock_api_manager, messages, tool_map, tools_list)
    
    assert len(result) == 2, f"Expected 2 messages, but got {len(result)}"
    assert result[0].role == "assistant", f"Expected first message role to be 'assistant', but got {result[0].role}"
    assert result[0].content == "API response", f"Expected first message content to be 'API response', but got {result[0].content}"
    assert result[1].role == "tool", f"Expected second message role to be 'tool', but got {result[1].role}"
    assert result[1].content == "Function called", f"Expected second message content to be 'Function called', but got {result[1].content}"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])