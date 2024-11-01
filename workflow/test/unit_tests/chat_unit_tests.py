import pytest
from unittest.mock import Mock, AsyncMock
from workflow.core import AliceChat, Prompt, APIManager, AliceAgent, AliceTask
from workflow.core.data_structures import ToolFunction, FunctionConfig, FunctionParameters, ParameterDefinition

@pytest.fixture
def mock_api_manager():
    return Mock(spec=APIManager)

@pytest.fixture
def sample_chat():
    return AliceChat(
        name="TestChat",
        alice_agent=AliceAgent(
            name="TestAgent",
            system_message=Prompt(name="test", content="You are a test assistant"),
            has_tools=True,
            has_code_exec=True,
        ),
    )

@pytest.fixture
def sample_task():
    return Mock(spec=AliceTask)

@pytest.mark.asyncio
async def test_generate_response_basic(sample_chat, mock_api_manager):
    mock_api_manager.generate_response_with_api_engine = AsyncMock(return_value={
        "content": "Test response",
        "tool_calls": None
    })
    
    new_messages = await sample_chat.generate_response(mock_api_manager, "Hello, AI!")
    
    assert len(new_messages) == 1
    assert new_messages[0]["role"] == "assistant"
    assert new_messages[0]["content"] == "Test response"
    assert new_messages[0]["generated_by"] == "llm"
    assert len(sample_chat.messages) == 2  # User message + AI response

@pytest.mark.asyncio
async def test_generate_response_with_function(sample_chat, mock_api_manager, sample_task):
    mock_api_manager.generate_response_with_api_engine = AsyncMock(return_value={
        "content": "Calling a function",
        "tool_calls": [{
            "function": {
                "name": "test_function",
                "arguments": '{"arg": "value"}'
            }
        }]
    })
    
    sample_task.get_function.return_value = {
        "tool_function": ToolFunction(function=FunctionConfig(
            name="test_function",
            description="Test function",
            parameters=FunctionParameters(
                type="object",
                properties={"arg": ParameterDefinition(type="string", description="Test argument")},
                required=["arg"]
            )
        )),
        "function_map": {"test_function": AsyncMock(return_value="Function result")}
    }
    
    sample_chat.functions = [sample_task]
    
    new_messages = await sample_chat.generate_response(mock_api_manager, "Call a function")
    
    assert len(new_messages) == 2
    assert new_messages[0]["role"] == "assistant"
    assert new_messages[0]["content"] == "Calling a function"
    assert new_messages[1]["role"] == "tool"
    assert new_messages[1]["content"] == "Function result"
    assert len(sample_chat.messages) == 3  # User message + AI response + Function result

def test_tool_list(sample_chat, mock_api_manager, sample_task):
    sample_task.get_function.return_value = {
        "tool_function": ToolFunction(function=FunctionConfig(
            name="test_function",
            description="Test function",
            parameters=FunctionParameters(
                type="object",
                properties={},
                required=[]
            )
        )),
        "function_map": {}
    }
    
    sample_chat.functions = [sample_task]
    
    tool_list = sample_chat.tool_list(mock_api_manager)
    
    assert len(tool_list) == 1
    assert tool_list[0]["function"]["name"] == "test_function"

def test_tool_map(sample_chat, mock_api_manager, sample_task):
    mock_function = AsyncMock()
    sample_task.get_function.return_value = {
        "tool_function": ToolFunction(function=FunctionConfig(
            name="test_function",
            description="Test function",
            parameters=FunctionParameters(
                type="object",
                properties={},
                required=[]
            )
        )),
        "function_map": {"test_function": mock_function}
    }
    
    sample_chat.functions = [sample_task]
    
    tool_map = sample_chat.tool_map(mock_api_manager)
    
    assert len(tool_map) == 1
    assert "test_function" in tool_map
    assert tool_map["test_function"] == mock_function

def test_deep_validate_required_apis(sample_chat, mock_api_manager, sample_task):
    mock_api_manager.retrieve_api_data.return_value = {}  # Simulate successful API retrieval
    
    sample_task.deep_validate_required_apis.return_value = {
        "status": "valid",
        "warnings": []
    }
    
    sample_chat.functions = [sample_task]
    
    validation_result = sample_chat.deep_validate_required_apis(mock_api_manager)
    
    assert validation_result["status"] == "valid"
    assert validation_result["llm_api"] == "valid"
    assert len(validation_result["functions"]) == 1
    assert validation_result["functions"][0]["status"] == "valid"

def test_deep_validate_required_apis_with_warnings(sample_chat, mock_api_manager, sample_task):
    mock_api_manager.retrieve_api_data.side_effect = ValueError("API not found")
    
    sample_task.deep_validate_required_apis.return_value = {
        "status": "warning",
        "warnings": ["Task warning"]
    }
    
    sample_chat.functions = [sample_task]
    
    validation_result = sample_chat.deep_validate_required_apis(mock_api_manager)
    
    assert validation_result["status"] == "warning"
    assert validation_result["llm_api"] == "invalid"
    assert len(validation_result["warnings"]) == 2  # LLM API warning + Task warning
    assert "API not found" in validation_result["warnings"]
    assert "Task warning" in validation_result["warnings"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])