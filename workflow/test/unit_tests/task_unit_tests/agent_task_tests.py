import pytest
from unittest.mock import Mock, AsyncMock, patch
from workflow.core import BasicAgentTask, FunctionParameters, ParameterDefinition, AliceAgent, Prompt, AliceModel, TaskResponse, MessageDict, LLMChatOutput, ApiType
from workflow.core.api import APIManager

@pytest.fixture
def mock_api_manager():
    return Mock(spec=APIManager)

@pytest.fixture
def sample_agent():
    return AliceAgent(
        name="TestAgent",
        system_message=Prompt(name="test", content="You are a test assistant"),
        models= {"chat": AliceModel(short_name="TestModel", model_name="test-model", model_format="OpenChat", ctx_size=1000, model_type="chat", deployment="test")}
    )

@pytest.fixture
def sample_basic_agent_task(sample_agent):
    return BasicAgentTask(
        task_name="TestBasicAgentTask",
        task_description="A test basic agent task",
        agent=sample_agent,
        input_variables=FunctionParameters(
            type="object",
            properties={
                "messages": ParameterDefinition(
                    type="list",
                    description="A list of message dictionaries",
                    default=None
                )
            },
            required=["messages"]
        )
    )

@pytest.mark.asyncio
async def test_basic_agent_task_initialization(sample_basic_agent_task):
    assert sample_basic_agent_task.task_name == "TestBasicAgentTask"
    assert sample_basic_agent_task.task_description == "A test basic agent task"
    assert isinstance(sample_basic_agent_task.agent, AliceAgent)
    assert sample_basic_agent_task.required_apis == [ApiType.LLM_MODEL]

@pytest.mark.asyncio
async def test_tool_list_and_tool_map(sample_basic_agent_task, mock_api_manager):
    tool_list = sample_basic_agent_task.tool_list(mock_api_manager)
    tool_map = sample_basic_agent_task.tool_map(mock_api_manager)
    
    assert tool_list is None  # As there are no tasks defined in the fixture
    assert tool_map == {}  # As there are no tasks defined in the fixture

@pytest.mark.asyncio
@patch.object(AliceAgent, 'chat', new_callable=AsyncMock)
async def test_run_basic_agent_task(mock_chat, sample_basic_agent_task, mock_api_manager):
    mock_messages = [MessageDict(role="user", content="Hello")]
    mock_new_messages = [MessageDict(role="assistant", content="Hi there!")]
    
    mock_chat.return_value = mock_new_messages
    
    result = await sample_basic_agent_task.run(api_manager=mock_api_manager, messages=mock_messages)
    
    mock_chat.assert_called_once_with(
        api_manager=mock_api_manager,
        messages=mock_messages,
        max_turns=1,
        tool_map={},
        tool_list=None  # Changed from tools_list to tool_list
    )
    
    assert isinstance(result, TaskResponse)
    assert result.task_name == "TestBasicAgentTask"
    assert result.status == "complete"
    assert result.result_code == 0
    assert isinstance(result.task_content, LLMChatOutput)
    assert len(result.task_content.content) == 2  # Original message + new message

@pytest.mark.asyncio
@patch.object(AliceAgent, 'chat', new_callable=AsyncMock)
async def test_run_basic_agent_task_with_termination(mock_chat, sample_basic_agent_task, mock_api_manager):
    mock_messages = [MessageDict(role="user", content="Hello")]
    mock_new_messages = [MessageDict(role="assistant", content="Task completed. TERMINATE")]
    
    mock_chat.return_value = mock_new_messages
    
    result = await sample_basic_agent_task.run(api_manager=mock_api_manager, messages=mock_messages)
    
    mock_chat.assert_called_once_with(
        api_manager=mock_api_manager,
        messages=mock_messages,
        max_turns=1,
        tool_map={},
        tool_list=None  # Changed from tools_list to tool_list
    )
    
    assert isinstance(result, TaskResponse)
    assert result.status == "complete"
    assert result.result_code == 0
    assert "Task execution terminated by the agent" in result.result_diagnostic

@pytest.mark.asyncio
async def test_get_exit_code(sample_basic_agent_task):
    assert sample_basic_agent_task.get_exit_code([MessageDict(role="assistant", content="Success")], False) == 0
    assert sample_basic_agent_task.get_exit_code([], False) == 1
    assert sample_basic_agent_task.get_exit_code([MessageDict(role="assistant")], False) == 1

if __name__ == "__main__":
    pytest.main([__file__, "-v"])