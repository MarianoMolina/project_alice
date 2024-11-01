import pytest
from unittest.mock import Mock
from workflow.core import FunctionParameters, ParameterDefinition, APIManager, API, AliceTask, Workflow, TaskResponse, StringOutput

class MockTask(AliceTask):
    async def run(self, **kwargs):
        return TaskResponse(
            task_id="mock_id",
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete",
            result_code=0,
            task_outputs="Mock output",
            task_inputs=kwargs,
            result_diagnostic="Mock diagnostic",
            execution_history=kwargs.get("execution_history", [])
        )

class FailingMockTask(MockTask):
    async def run(self, **kwargs):
        return TaskResponse(
            task_id="mock_id",
            task_name=self.task_name,
            task_description=self.task_description,
            status="failed",
            result_code=1,
            task_outputs="Failed output",
            task_inputs=kwargs,
            result_diagnostic="Task failed"
        )

class ExceptionMockTask(MockTask):
    async def run(self, **kwargs):
        raise ValueError("Test exception")

@pytest.fixture
def sample_workflow():
    task1 = MockTask(
        task_name="Task1",
        task_description="First task",
        input_variables=FunctionParameters(
            type="object",
            properties={
                "input1": ParameterDefinition(type="string", description="Input for Task1")
            },
            required=["input1"]
        )
    )
    task2 = MockTask(
        task_name="Task2",
        task_description="Second task",
        input_variables=FunctionParameters(
            type="object",
            properties={
                "input2": ParameterDefinition(type="string", description="Input for Task2")
            },
            required=["input2"]
        )
    )
    return Workflow(
        task_name="TestWorkflow",
        task_description="A test workflow",
        tasks={"Task1": task1, "Task2": task2},
        start_node="Task1",
        node_end_code_routing={
            "Task1": {0: ("Task2", False)},
            "Task2": {0: (None, False)}
        },
        input_variables=FunctionParameters(
            type="object",
            properties={
                "workflow_input": ParameterDefinition(type="string", description="Input for workflow")
            },
            required=["workflow_input"]
        )
    )

@pytest.mark.asyncio
async def test_workflow_execution(sample_workflow):
    result = await sample_workflow.run(workflow_input="test", input1="test1", input2="test2")
    
    assert isinstance(result, TaskResponse)
    assert result.task_name == "TestWorkflow"
    assert result.status == "complete"
    assert result.result_code == 0
    assert len(result.task_content.content) == 2  # Two tasks executed

@pytest.mark.asyncio
async def test_workflow_max_attempts(sample_workflow):
    # Replace Task1 with FailingMockTask
    sample_workflow.tasks["Task1"] = FailingMockTask(
        task_name="Task1",
        task_description="First task",
        input_variables=sample_workflow.tasks["Task1"].input_variables
    )
    
    sample_workflow.node_end_code_routing["Task1"][1] = ("Task1", True)
    sample_workflow.max_attempts = 3
    
    result = await sample_workflow.run(workflow_input="test", input1="test1")
    
    assert result.status == "failed"
    assert "maximum attempts reached" in result.result_diagnostic.lower()
    assert len(result.task_content.content) == 3  # Three attempts made

@pytest.mark.asyncio
async def test_workflow_step_through(sample_workflow, monkeypatch):
    # Mock the input function
    monkeypatch.setattr('builtins.input', lambda _: '')
    
    result = await sample_workflow.run(step_through=True, workflow_input="test", input1="test1", input2="test2")
    
    assert result.status == "complete"
    assert len(result.task_content.content) == 2


class DebugMockTask(AliceTask):
    async def run(self, **kwargs):
        print(f"Executing task {self.task_name}")
        print(f"Task inputs: {kwargs}")
        if 'api_manager' in kwargs:
            print(f"API Manager present: {kwargs['api_manager']}")
            # Use the api_manager to ensure the method is called
            api_manager = kwargs['api_manager']
            api_manager.get_api_by_type('some_type')
        else:
            print("API Manager not present in task inputs")
        
        # Create a fully serializable TaskResponse
        return TaskResponse(
            task_id="mock_id",
            task_name=self.task_name,
            task_description=self.task_description,
            status="complete",
            result_code=0,
            task_outputs="Mock output",
            task_content=StringOutput(content=["Mock output"]),
            task_inputs={k: str(v) for k, v in kwargs.items()},  # Convert all inputs to strings
            result_diagnostic="Mock diagnostic",
            execution_history=kwargs.get("execution_history", [])
        )

@pytest.fixture
def debug_workflow():
    task1 = DebugMockTask(
        task_name="Task1",
        task_description="First task",
        input_variables=FunctionParameters(
            type="object",
            properties={
                "input1": ParameterDefinition(type="string", description="Input for Task1")
            },
            required=["input1"]
        )
    )
    task2 = DebugMockTask(
        task_name="Task2",
        task_description="Second task",
        input_variables=FunctionParameters(
            type="object",
            properties={
                "input2": ParameterDefinition(type="string", description="Input for Task2")
            },
            required=["input2"]
        )
    )
    return Workflow(
        task_name="TestWorkflow",
        task_description="A test workflow",
        tasks={"Task1": task1, "Task2": task2},
        start_node="Task1",
        node_end_code_routing={
            "Task1": {0: ("Task2", False)},
            "Task2": {0: (None, False)}
        },
        input_variables=FunctionParameters(
            type="object",
            properties={
                "workflow_input": ParameterDefinition(type="string", description="Input for workflow")
            },
            required=["workflow_input"]
        )
    )

@pytest.mark.asyncio
async def test_workflow_with_api_manager(debug_workflow, caplog):
    mock_api_manager = Mock(spec=APIManager)
    mock_api = Mock(spec=API, is_active=True, health_status="healthy")
    mock_api_manager.get_api_by_type.return_value = mock_api
    
    result = await debug_workflow.run(api_manager=mock_api_manager, workflow_input="test", input1="test1", input2="test2")
    
    print(f"Workflow result: {result}")
    print(f"Workflow status: {result.status}")
    print(f"Workflow diagnostic: {result.result_diagnostic}")
    
    if hasattr(result, 'task_content') and result.task_content:
        for task_result in result.task_content.content:
            print(f"Task {task_result.task_name} result: {task_result.status}")
            print(f"Task {task_result.task_name} diagnostic: {task_result.result_diagnostic}")
    
    assert result.status == "complete"
    assert len(result.task_content.content) == 2
    
    # Check if api_manager was used
    mock_api_manager.get_api_by_type.assert_called()
    
    # Print call count for additional debugging
    print(f"get_api_by_type call count: {mock_api_manager.get_api_by_type.call_count}")

@pytest.mark.asyncio
async def test_workflow_exception_handling(sample_workflow):
    # Replace Task1 with ExceptionMockTask
    sample_workflow.tasks["Task1"] = ExceptionMockTask(
        task_name="Task1",
        task_description="First task",
        input_variables=sample_workflow.tasks["Task1"].input_variables
    )
    
    result = await sample_workflow.run(workflow_input="test", input1="test1")
    
    assert result.status == "failed"
    assert "ValueError: Test exception" in result.result_diagnostic

if __name__ == "__main__":
    pytest.main([__file__, "-v"])