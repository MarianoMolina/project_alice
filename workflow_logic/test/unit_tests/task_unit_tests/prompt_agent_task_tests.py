import pytest
from unittest.mock import Mock, AsyncMock, patch
from workflow_logic.core import PromptAgentTask, AliceAgent, FunctionParameters, ParameterDefinition, Prompt, AliceModel, APIManager, TaskResponse, MessageDict

@pytest.fixture
def mock_api_manager():
    return Mock(spec=APIManager)

@pytest.fixture
def sample_agent():
    return AliceAgent(
        name="TestAgent",
        system_message=Prompt(name="test", content="You are a test assistant"),
        model_id=AliceModel(short_name="TestModel", model_name="test-model", model_format="OpenChat", ctx_size=1000, model_type="chat", deployment="test")
    )

@pytest.fixture
def sample_prompt_agent_task(sample_agent):
    return PromptAgentTask(
        task_name="TestPromptAgentTask",
        task_description="A test prompt agent task",
        agent=sample_agent,
        input_variables=FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string",
                    description="The input prompt for the task",
                    default=None
                ),
                "optional_param": ParameterDefinition(
                    type="integer",
                    description="An optional parameter",
                    default=42
                )
            },
            required=["prompt"]
        ),
        templates={
            "task_template": Prompt(
                name="test_template",
                content="User input: {{prompt}}. Optional: {{optional_param}}",
                is_templated=True,
                parameters=FunctionParameters(
                    type="object",
                    properties={
                        "prompt": ParameterDefinition(type="string", description="The input prompt"),
                        "optional_param": ParameterDefinition(type="integer", description="An optional parameter")
                    },
                    required=["prompt"]
                )
            )
        }
    )

def test_create_message_list(sample_prompt_agent_task):
    messages = sample_prompt_agent_task.create_message_list(prompt="Hello, AI!", optional_param=100)
    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "User input: Hello, AI!. Optional: 100"
    assert messages[0]["generated_by"] == "user"
    assert messages[0]["step"] == "TestPromptAgentTask"

def test_create_message_list_missing_required(sample_prompt_agent_task):
    with pytest.raises(ValueError, match="Missing required parameter: prompt"):
        sample_prompt_agent_task.create_message_list(optional_param=100)

def test_create_message_list_invalid_type(sample_prompt_agent_task):
    with pytest.raises(TypeError, match="Parameter 'prompt' should be of type string"):
        sample_prompt_agent_task.create_message_list(prompt=123)

def test_update_inputs(sample_prompt_agent_task):
    sanitized = sample_prompt_agent_task.update_inputs(prompt="Test prompt", optional_param=200)
    assert sanitized == {"prompt": "Test prompt", "optional_param": 200}

def test_update_inputs_default_value(sample_prompt_agent_task):
    sanitized = sample_prompt_agent_task.update_inputs(prompt="Test prompt")
    assert sanitized == {"prompt": "Test prompt", "optional_param": 42}

def test_update_inputs_invalid_optional(sample_prompt_agent_task):
    with pytest.raises(TypeError, match="Parameter 'optional_param' should be of type integer"):
        sample_prompt_agent_task.update_inputs(prompt="Test prompt", optional_param="not an integer")

@pytest.mark.asyncio
@patch.object(AliceAgent, 'chat', new_callable=AsyncMock)
async def test_run_prompt_agent_task(mock_chat, sample_prompt_agent_task, mock_api_manager):
    mock_chat.return_value = [MessageDict(role="assistant", content="Response to the prompt")]
    
    result = await sample_prompt_agent_task.run(api_manager=mock_api_manager, prompt="Test prompt")
    
    mock_chat.assert_called_once_with(
        api_manager=mock_api_manager,
        messages=[{
            "content": "User input: Test prompt. Optional: 42",
            "role": "user",
            "generated_by": "user",
            "step": "TestPromptAgentTask"
        }],
        max_turns=1,
        tool_map={},
        tool_list=None
    )
    
    assert isinstance(result, TaskResponse)
    assert result.task_name == "TestPromptAgentTask"
    assert result.status == "complete"
    assert result.result_code == 0

@pytest.mark.asyncio
async def test_get_prompt_template(sample_prompt_agent_task):
    template = sample_prompt_agent_task.get_prompt_template("task_template")
    assert isinstance(template, Prompt)
    assert template.name == "test_template"

@pytest.mark.asyncio
async def test_get_prompt_template_not_found(sample_prompt_agent_task):
    with pytest.raises(ValueError, match="Template non_existent_template not found in the task templates dictionary."):
        sample_prompt_agent_task.get_prompt_template("non_existent_template")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])