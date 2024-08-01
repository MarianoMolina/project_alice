import pytest
from unittest.mock import Mock, AsyncMock
from workflow_logic.core.api import APIManager, ApiType, API, APIEngine
from workflow_logic.util import TaskResponse, DatabaseTaskResponse
from workflow_logic.core import FunctionParameters, ParameterDefinition, AliceTask
from pydantic import ValidationError

class ConcreteAliceTask(AliceTask):
    async def run(self, **kwargs):
        exec_history = kwargs.pop("execution_history", None)
        api_manager = kwargs.pop("api_manager", None)
        
        if self.api_engine:
            # Use the API engine if it's available
            return await self.api_engine.generate_api_response(api_manager, **kwargs)
        
        # Fall back to the original behavior if no API engine is set
        return TaskResponse(
            task_id="test_id",
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete",
            result_code=0,
            task_outputs="Test output",
            task_inputs=kwargs,
            result_diagnostic="Test diagnostic",
            execution_history=exec_history
        )
    
@pytest.fixture
def sample_task():
    return ConcreteAliceTask(
        task_name="TestTask",
        task_description="A test task",
        input_variables=FunctionParameters(
            type="object",
            properties={
                "test_input": ParameterDefinition(type="string", description="Test input")
            },
            required=["test_input"]
        ),
        required_apis=[ApiType.LLM_MODEL]
    )

@pytest.fixture
def mock_api_manager():
    manager = Mock(spec=APIManager)
    mock_api = Mock(spec=API, is_active=True, health_status="healthy")
    manager.get_api_by_type.return_value = mock_api
    return manager

@pytest.mark.asyncio
async def test_a_execute_basic(sample_task, mock_api_manager):
    result = await sample_task.a_execute(api_manager=mock_api_manager, test_input="test value")
    
    assert isinstance(result, DatabaseTaskResponse)
    assert result.task_name == "TestTask"
    assert result.status == "complete"
    assert result.result_code == 0
    assert result.task_outputs == "Test output"
    assert "test_input" in result.task_inputs

@pytest.mark.asyncio
async def test_a_execute_recursion_check(sample_task, mock_api_manager):
    sample_task.recursive = False
    
    with pytest.raises(RecursionError, match="Task TestTask is already in the execution history, preventing recursion."):
        await sample_task.a_execute(
            api_manager=mock_api_manager,
            test_input="test value",
            execution_history=[{"task_name": "TestTask"}]
        )

def test_validate_required_apis(sample_task, mock_api_manager):
    assert sample_task.validate_required_apis(mock_api_manager) == True
    
    mock_api_manager.get_api_by_type.return_value = Mock(is_active=False)
    with pytest.raises(ValueError, match="Required API llm_api is not active or not found."):
        sample_task.validate_required_apis(mock_api_manager)
    
    mock_api_manager.get_api_by_type.return_value = Mock(is_active=True, health_status="unhealthy")
    with pytest.raises(ValueError, match="Required API llm_api is not healthy."):
        sample_task.validate_required_apis(mock_api_manager)

def test_deep_validate_required_apis(sample_task, mock_api_manager):
    result = sample_task.deep_validate_required_apis(mock_api_manager)
    assert result["status"] == "valid"
    assert len(result["warnings"]) == 0
    
    mock_api_manager.get_api_by_type.return_value = Mock(is_active=False)
    result = sample_task.deep_validate_required_apis(mock_api_manager)
    assert result["status"] == "warning"
    assert len(result["warnings"]) == 1
    assert "Required API llm_api is not active or not found." in result["warnings"][0]

def test_get_function(sample_task):
    result = sample_task.get_function()
    
    assert "tool_function" in result
    assert "function_map" in result
    assert result["tool_function"].function.name == "TestTask"
    assert result["tool_function"].function.description == "A test task"
    assert "test_input" in result["tool_function"].function.parameters.properties

def test_get_failed_task_response(sample_task):
    result = sample_task.get_failed_task_response("Test failure")
    
    assert isinstance(result, TaskResponse)
    assert result.status == "failed"
    assert result.result_code == 1
    assert result.result_diagnostic == "Test failure"

def test_task_type_property(sample_task):
    assert sample_task.task_type == "ConcreteAliceTask"

def test_model_dump(sample_task):
    dumped = sample_task.model_dump()
    
    assert "task_type" in dumped
    assert dumped["task_type"] == "ConcreteAliceTask"
    assert "required_apis" in dumped
    assert ApiType.LLM_MODEL.value in dumped["required_apis"]

@pytest.mark.asyncio
async def test_a_execute_with_api_engine(sample_task, mock_api_manager):
    api_engine_mock = AsyncMock(spec=APIEngine)
    api_engine_mock.generate_api_response.return_value = TaskResponse(
        task_id="test_id",
        task_name="TestTask",
        task_description="A test task",
        status="complete",
        result_code=0,
        task_outputs="API Engine output",
        task_inputs={},
        result_diagnostic="API Engine diagnostic"
    )
    sample_task.api_engine = api_engine_mock
    
    result = await sample_task.a_execute(api_manager=mock_api_manager, test_input="test value")
    
    assert isinstance(result, DatabaseTaskResponse)
    assert result.task_outputs == "API Engine output"
    assert result.result_diagnostic == "API Engine diagnostic"
    api_engine_mock.generate_api_response.assert_called_once_with(mock_api_manager, test_input="test value")


def test_invalid_task_creation():
    with pytest.raises(ValidationError):
        ConcreteAliceTask(
            task_name=None,  # Invalid: None is not a valid string
            task_description="A test task",
            input_variables=FunctionParameters(
                type="object",
                properties={},
                required=[]
            )
        )

if __name__ == "__main__":
    pytest.main([__file__, "-v"])