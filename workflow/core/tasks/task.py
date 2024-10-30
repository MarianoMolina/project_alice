from enum import Enum
from typing import Dict, Any, Optional, List, Callable, Tuple
from pydantic import BaseModel, Field, model_validator
from workflow.core.prompt import Prompt
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager, APIEngine
from workflow.core.data_structures import (
    ApiType, FunctionParameters, ParameterDefinition,  FunctionConfig, ToolFunction, References, TaskResponse, 
    NodeResponse, UserInteraction, UserCheckpoint, NodeResponse, TasksEndCodeRouting
)
from workflow.util.utils import simplify_execution_history, generate_default_summary, convert_value_to_type
from workflow.util import LOGGER

class AliceTask(BaseModel):
    """
    Base class for all tasks in the Alice workflow system, incorporating node-based execution.
    
    This class provides the foundation for creating complex, multi-step tasks with
    built-in support for node-based execution flow, attempt tracking, recursion control,
    API validation, and function representation, and user interactions.
    """
    # Basic task information
    id: Optional[str] = Field(default=None, description="Task ID", alias="_id")
    task_name: str = Field(..., description="Name of the task")
    task_description: str = Field(..., description="Clear description of task purpose")
    
    # Execution control
    start_node: Optional[str] = Field(default=None, description="Starting node name")
    recursive: bool = Field(True, description="Whether task can be executed recursively")
    max_attempts: int = Field(1, description="Maximum attempts per node before failure")
    timeout: Optional[int] = Field(default=None, description="Task timeout in seconds")
    
    # Node and execution routing
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={}, 
        description="Routing rules between nodes based on exit codes"
    )
    user_checkpoints: Dict[str, UserCheckpoint] = Field(
        default_factory=dict,
        description="Node-specific user interaction checkpoints"
    )
    task_selection_method: Optional[Callable[[TaskResponse, List[NodeResponse]], Optional[str]]] = Field(
        None, 
        description="Optional method to select next task based on response"
    )
    
    # Task configuration
    input_variables: FunctionParameters = Field(
        default_factory=lambda: FunctionParameters(
            type="object",
            properties={"prompt": ParameterDefinition(
                type="string",
                description="Input prompt",
                default=None
            )},
            required=["prompt"]
        ),
        description="Expected input structure"
    )
    exit_codes: Dict[int, str] = Field(
        default_factory=lambda: {0: "Success", 1: "Failed"},
        description="Exit code meanings"
    )
    required_apis: List[ApiType] = Field(
        default_factory=list,
        description="Required API types"
    )
    
    # Task components
    templates: Dict[str, Prompt] = Field(
        default_factory=dict,
        description="Task prompt templates. output_template is used to format task output."
    )
    tasks: Dict[str, "AliceTask"] = Field(
        default_factory=dict,
        description="Subtasks"
    )
    agent: Optional[AliceAgent] = Field(
        default=None,
        description="Associated agent"
    )
    api_engine: Optional[APIEngine] = Field(
        default=None,
        description="Associated API engine"
    )
    data_cluster: Optional[References] = Field(
        default=None,
        description="Associated data cluster"
    )

    @property
    def task_type(self) -> str:
        return self.__class__.__name__

    # Model validation    
    @model_validator(mode='before')
    def convert_routing_lists_to_tuples(cls, values):
        """
        Converts list-format routing values from database to tuples for internal use.
        Handles both string-keyed and int-keyed dictionaries with robust error handling.
        """
        routing = values.get('node_end_code_routing')
        if not routing:
            return values
            
        try:
            LOGGER.debug(f"Processing routing data: {routing}")
            converted_routing = {}
            
            for node, routes in routing.items():
                LOGGER.debug(f"Processing node {node} with routes: {routes}")
                converted_routes = {}
                
                for code, route in routes.items():
                    try:
                        # Convert string codes to int
                        code_key = int(code) if isinstance(code, str) else code
                        
                        # Handle different input formats
                        if isinstance(route, (list, tuple)):
                            if len(route) < 2:
                                LOGGER.warning(f"Invalid route format for {node}.{code}: {route}")
                                continue
                                
                            first_elem = route[0] if route[0] is not None else None
                            second_elem = bool(route[1])  # Ensure boolean
                            converted_routes[code_key] = (first_elem, second_elem)
                            
                        elif isinstance(route, dict):
                            # Handle possible dictionary format
                            first_elem = route.get(0) if route.get(0) is not None else None
                            second_elem = bool(route.get(1, False))
                            converted_routes[code_key] = (first_elem, second_elem)
                            
                        else:
                            LOGGER.warning(f"Unexpected route format for {node}.{code}: {route}")
                            continue
                            
                    except (ValueError, TypeError, IndexError) as e:
                        LOGGER.error(f"Error processing route for {node}.{code}: {str(e)}")
                        continue
                
                if converted_routes:  # Only add if we have valid routes
                    converted_routing[node] = converted_routes
                else:
                    LOGGER.warning(f"No valid routes found for node {node}")
            
            LOGGER.debug(f"Converted routing: {converted_routing}")
            values['node_end_code_routing'] = converted_routing
            
        except Exception as e:
            LOGGER.error(f"Error converting routing data: {str(e)}")
            LOGGER.error(f"Original routing data: {routing}")
            raise ValueError(f"Failed to process routing configuration: {str(e)}")
            
        return values
    
    # Serialization method
    def model_dump(self, *args, **kwargs):
        # Create a copy of the current instance's dict
        data = dict(self.__dict__)
        
        # Handle nested tasks before calling super().model_dump()
        if 'tasks' in data and isinstance(data['tasks'], dict):
            data['tasks'] = {
                task_id: task.model_dump(*args, **kwargs) if isinstance(task, AliceTask) else task
                for task_id, task in data['tasks'].items()
            }

        # Call super().model_dump() with the updated data
        dumped_data = super().model_dump(*args, **kwargs, exclude={'tasks'})
        
        # Add the task_type
        dumped_data['task_type'] = self.task_type

        # Add the processed tasks back to the dumped data
        if 'tasks' in data:
            dumped_data['tasks'] = data['tasks']

        # Handle ApiType enums or strings in required_apis
        if 'required_apis' in dumped_data and dumped_data['required_apis']:
            LOGGER.debug(f'Original required_apis: {dumped_data["required_apis"]}')
            dumped_data['required_apis'] = [
                api.value if isinstance(api, Enum) else api
                for api in dumped_data['required_apis']
            ]
            LOGGER.debug(f'Updated required_apis: {dumped_data["required_apis"]}')

        # Handle other potential nested AliceTask objects and enums
        for key, value in dumped_data.items():
            if isinstance(value, AliceTask):
                dumped_data[key] = value.model_dump(*args, **kwargs)
            elif isinstance(value, list):
                dumped_data[key] = [
                    item.value if isinstance(item, Enum) else
                    item.model_dump(*args, **kwargs) if isinstance(item, AliceTask) else item
                    for item in value
                ]
            elif isinstance(value, dict):
                dumped_data[key] = {
                    k: (v.value if isinstance(v, Enum) else
                        v.model_dump(*args, **kwargs) if isinstance(v, AliceTask) else v)
                    for k, v in value.items()
                }
            elif isinstance(value, Enum):
                dumped_data[key] = value.value
        if 'api_engine' in dumped_data and dumped_data['api_engine']:
            dumped_data.pop('api_engine')
            
        return dumped_data

    # Execution methods
    async def run(self, execution_history: List[NodeResponse] = None, **kwargs) -> TaskResponse:
        """
        Execute the task with node-based flow and attempt tracking.
        
        Validates inputs, handles API validation, and manages node execution flow.
        
        Args:
            execution_history (List[NodeResponse], optional): Previous execution history.
            **kwargs: Task input parameters.
        
        Returns:
            TaskResponse: The result of the task execution.
        """
        execution_history = execution_history or []
        node_responses: List[NodeResponse] = []
        
        try:
            # Validate and process inputs
            processed_inputs, error_msg = self.validate_and_process_inputs(execution_history=execution_history, **kwargs)
            if error_msg:
                return self.get_failed_task_response(error_msg, **kwargs)

            # Update kwargs with processed inputs
            kwargs.update(processed_inputs)

            # Validate required APIs
            if self.required_apis:
                api_manager = kwargs.get("api_manager")
                if not api_manager:
                    return self.get_failed_task_response("API manager not provided", **kwargs)
                if not self.validate_required_apis(api_manager):
                    return self.get_failed_task_response("Required APIs not available", **kwargs)
            
            # Execute nodes
            current_node = self.start_node or next(iter(self.node_end_code_routing.keys()))
            while current_node:
                # Check attempt limits
                if not self.can_retry_node(current_node, execution_history + node_responses):
                    return self.create_final_response(
                        node_responses,
                        exit_code=1,
                        diagnostics=f"Maximum attempts reached for node {current_node}",
                        **kwargs
                    )
                
                # Execute current node
                node_response = await self.execute_node(
                    current_node,
                    execution_history,
                    node_responses,
                    **kwargs
                )
                
                # Handle user interaction
                if node_response.references and node_response.references.user_interactions:
                    return self.create_partial_response(node_responses, "pending", **kwargs)
                
                node_responses.append(node_response)
                
                # Get next node
                current_node = self.get_next_node(current_node, execution_history + node_responses)
            
            return self.create_final_response(node_responses, **kwargs)
            
        except Exception as e:
            LOGGER.error(f"Error executing task {self.task_name}: {str(e)}")
            return self.get_failed_task_response(str(e), **kwargs)
        
    async def execute_node(self, node_name: str, execution_history: List[NodeResponse], node_responses: List[NodeResponse], **kwargs) -> NodeResponse:
        """Execute a single node with user checkpoint handling."""
        # Check for user interaction
        user_interaction = self.handle_user_checkpoints(execution_history, node_name)
        if user_interaction:
            return user_interaction

        # Get node method
        method_name = f"execute_{node_name}"
        if not hasattr(self, method_name):
            return NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=1,
                references=References(messages=[{
                    "role": "system",
                    "content": f"No implementation found for node {node_name}",
                    "generated_by": "system"
                }]),
                execution_order=len(execution_history) + len(node_responses)
            )

        # Execute node method
        try:
            node_response: NodeResponse = await getattr(self, method_name)(execution_history, node_responses, **kwargs)
            # Update kwargs if node name exists as a variable
            if node_name in kwargs:
                try:
                    value = node_response.references.detailed_summary()
                    if node_name in self.input_variables.properties:
                        param_type = self.input_variables.properties[node_name].type
                        kwargs[node_name] = self._convert_value_to_type(value, node_name, param_type)
                    else:
                        kwargs[node_name] = value
                    LOGGER.debug(f"Updated variable {node_name} with node output")
                except (ValueError, TypeError) as e:
                    LOGGER.warning(f"Failed to update variable {node_name} with node output: {e}")
            
            return node_response
        except Exception as e:
            LOGGER.error(f"Error executing node {node_name}: {str(e)}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=1,
                references=References(messages=[{
                    "role": "system",
                    "content": f"Error in node {node_name}: {str(e)}",
                    "generated_by": "system"
                }]),
                execution_order=len(execution_history) + len(node_responses)
            )
    
    # User interaction handling
    def handle_user_checkpoints(self, execution_history: List[NodeResponse] = None, node_name: str = None) -> Optional[NodeResponse]:
        """
        Handles user checkpoints. This method can be called by subclasses before their specific logic.
        Returns a TaskResponse if a user interaction is needed, None otherwise.
        """
        execution_history = execution_history or []
        node_name = node_name or self.start_node or "default"
       
        if node_name in self.user_checkpoints:
            completed_interaction = next((
                node for node in reversed(execution_history)
                if node.node_name == node_name
                and node.references.user_interactions
                and node.references.user_interactions[-1].user_response is not None
            ), None)
           
            if not completed_interaction:
                return self.create_user_interaction(node_name, len(execution_history))
        return None
    
    def create_user_interaction(self, node_name: str, execution_order: int) -> NodeResponse:
        """
        Creates a UserInteraction for the specified node and returns it wrapped in a NodeResponse.

        Args:
            node_name (str): The name of the node for which to create the user interaction.
            execution_order (int): The execution order for this node in the task's sequence.

        Returns:
            NodeResponse: A NodeResponse object containing the UserInteraction.

        Raises:
            ValueError: If no UserCheckpoint is defined for the specified node.
        """
        if node_name not in self.user_checkpoints:
            raise ValueError(f"No UserCheckpoint defined for node '{node_name}'")

        checkpoint = self.user_checkpoints[node_name]
        user_interaction = UserInteraction(
            user_checkpoint_id=checkpoint.id,
            task_response_id=self.id
        )

        return NodeResponse(
            parent_task_id=self.id,
            node_name=node_name,
            execution_order=execution_order,
            references=References(user_interactions=[user_interaction])
        )
    
    # Execution tracking
    def count_node_attempts(self, node_name: str, execution_history: List[NodeResponse]) -> int:
        """Count previous attempts for a specific node in this task."""
        return sum(
            1 for node in execution_history 
            if node.parent_task_id == self.id 
            and node.node_name == node_name
        )

    def can_retry_node(self, node_name: str, execution_history: List[NodeResponse]) -> bool:
        """Determine if a node can be retried based on attempts and recursion settings."""
        attempts = self.count_node_attempts(node_name, execution_history)
        
        if attempts >= self.max_attempts:
            LOGGER.warning(f"Node {node_name} has reached maximum attempts ({self.max_attempts})")
            return False
            
        if not self.recursive and attempts > 0:
            LOGGER.warning(f"Node {node_name} cannot be retried as task is not recursive")
            return False
            
        return True

    def get_next_node(self, current_node: str, execution_history: List[NodeResponse]) -> Optional[str]:
        """
        Determine the next node to execute based on either the task selection method or routing configuration,
        and attempt limits.
        """
        if self.task_selection_method:
            # Find the last response for the current node
            for node in reversed(execution_history):
                if node.node_name == current_node:
                    if node.references and node.references.task_responses:
                        task_response = node.references.task_responses[-1]
                        next_task, _ = self.task_selection_method(task_response, execution_history)
                        return next_task
                    break
            return None

        # Fall back to standard routing logic
        if current_node not in self.node_end_code_routing:
            return None
            
        last_node = next(
            (node for node in reversed(execution_history)
             if node.parent_task_id == self.id and node.node_name == current_node),
            None
        )
        if not last_node:
            return None
            
        routing = self.node_end_code_routing[current_node]
        next_node, is_retry = routing.get(last_node.exit_code, (None, False))
        
        if next_node and is_retry:
            if not self.can_retry_node(current_node, execution_history):
                LOGGER.warning(f"Cannot retry node {current_node}")
                return None
        elif next_node:
            if not self.can_retry_node(next_node, execution_history):
                LOGGER.warning(f"Cannot proceed to node {next_node} - max attempts reached")
                return None
                
        return next_node

    # Response creation methods
    def get_task_response(self, task_outputs: str, result_code: int, diagnostics: str = None, 
                         status: str = "complete", node_references: List[NodeResponse] = None, **kwargs) -> TaskResponse:
        """Create a standardized task response."""
        exec_history = kwargs.pop("execution_history", None)
        if exec_history and isinstance(exec_history, list):
            exec_history = simplify_execution_history(exec_history)
            
        kwargs.pop("api_manager", None)
        
        return TaskResponse(
            task_id=self.id or '',
            task_name=self.task_name,
            task_description=self.task_description,
            status=status,
            result_code=result_code,
            task_outputs=task_outputs,
            task_inputs=kwargs,
            result_diagnostic=diagnostics,
            node_references=node_references or [],
            execution_history=exec_history
        )
    
    def create_partial_response(self, node_responses: List[NodeResponse], status: str, **kwargs) -> TaskResponse:
        """Create a response for a partially completed task."""
        output_template = self.get_prompt_template("output_template")
        return self.get_task_response(
            task_outputs=generate_node_responses_summary(node_responses, True, output_template),
            result_code=1,
            diagnostics='Task requires user interaction',
            status=status,
            node_references=node_responses,
            **kwargs
        )
    
    def get_failed_task_response(self, diagnostics: str = None, **kwargs) -> TaskResponse:
        """
        Returns a failed task response with the given diagnostics.
        """
        return self.get_task_response("", 1, diagnostics, "failed", **kwargs)

    def create_final_response(self, node_responses: List[NodeResponse], exit_code: Optional[int] = None, diagnostics: Optional[str] = None, **kwargs) -> TaskResponse:
        """Create a response for a completed task."""
        if exit_code is None:
            exit_code = 1 if any(node.exit_code != 0 for node in node_responses) else 0
            
        if diagnostics is None:
            diagnostics = "Task completed successfully" if exit_code == 0 else "Task execution failed"
        
        # Try to use output template if available
        output_template = self.get_prompt_template("output_template")
        summary = generate_node_responses_summary(
            node_responses=node_responses, 
            verbose=True,
            output_prompt=output_template
        )
            
        return self.get_task_response(
            task_outputs=summary,
            result_code=exit_code,
            diagnostics=diagnostics,
            status="complete" if exit_code == 0 else "failed",
            node_references=node_responses,
            **kwargs
        )
    
    # Input validation
    def get_prompt_template(self, template_name: str) -> Optional[Prompt]:
        """Get a prompt template by name from the task's templates."""
        if template_name not in self.templates or not self.templates[template_name]:
            return None
        template = self.templates[template_name]
        if isinstance(template, dict):
            try:
                return Prompt(**template)
            except Exception as e:
                LOGGER.error(f"Error converting template dict to Prompt: {str(e)}")
                return None
        return template if isinstance(template, Prompt) else None

    async def validate_and_process_inputs(self, execution_history: List[NodeResponse], **kwargs) -> Tuple[Dict[str, Any], Optional[str]]:
        """Validate and process input parameters."""
        return validate_and_process_function_inputs(
            params=self.input_variables,
            execution_history=execution_history,
            kwargs=kwargs
        )

    def _convert_value_to_type(self, value: Any, param_name: str, param_type: str) -> Any:
        """
        Converts a value to the specified parameter type.
        
        Args:
            value: The value to convert
            param_name: The name of the parameter (for error messages)
            param_type: The target type to convert to
            
        Returns:
            The converted value
            
        Raises:
            ValueError: If conversion fails
        """
        try:
            if param_type == "string":
                return str(value)
            elif param_type == "integer":
                if isinstance(value, str):
                    # Try to convert string to float first to handle "1.0" -> 1
                    return int(float(value))
                return int(value)
            elif param_type == "number":
                return float(value)
            elif param_type == "boolean":
                if isinstance(value, str):
                    return value.lower() in ("true", "1", "yes", "y")
                return bool(value)
            elif param_type == "array":
                if isinstance(value, str):
                    import json
                    return json.loads(value)
                if isinstance(value, (list, tuple)):
                    return list(value)
                raise ValueError(f"Cannot convert {type(value)} to array")
            elif param_type == "object":
                if isinstance(value, str):
                    import json
                    return json.loads(value)
                if isinstance(value, dict):
                    return value
                raise ValueError(f"Cannot convert {type(value)} to object")
            else:
                return value
        except Exception as e:
            raise ValueError(f"Failed to convert {param_name} to {param_type}: {str(e)}")

    # API validation
    def validate_required_apis(self, api_manager: APIManager) -> bool:
        """Validate that all required APIs are available and healthy."""
        if not self.required_apis:
            return True
            
        for api_type in self.required_apis:
            api = api_manager.get_api_by_type(api_type)
            if not api or not api.is_active:
                LOGGER.error(f"Required API {api_type} not active or not found")
                return False
            if api.health_status != "healthy":
                LOGGER.error(f"Required API {api_type} not healthy")
                return False
                
        return True
    
    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        result = {
            "task_name": self.task_name,
            "status": "valid",
            "warnings": [],
            "child_tasks": []
        }

        try:
            self.validate_required_apis(api_manager)
        except ValueError as e:
            result["status"] = "warning"
            result["warnings"].append(str(e))

        for child_task_name, child_task in self.tasks.items():
            child_result = child_task.deep_validate_required_apis(api_manager)
            result["child_tasks"].append(child_result)
            if child_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].append(f"Warning in child task '{child_task_name}': {', '.join(child_result['warnings'])}")

        return result
    
    # Function representation
    def get_function(self, api_manager: Optional[APIManager] = None) -> Dict[str, Any]:
        """Get function representation for workflow integration."""
        async def function_callable(**kwargs) -> TaskResponse:
            params = {"api_manager": api_manager} if api_manager else {}
            return await self.run(**{**params, **kwargs})
        
        return {
            "tool_function": ToolFunction(
                type="function",
                function=FunctionConfig(
                    name=self.task_name,
                    description=self.task_description,
                    parameters=self.input_variables.model_dump()
                )
            ),
            "function_map": {self.task_name: function_callable}
        }
    
    # Utility methods
    def get_last_node_by_name(self, node_responses: List[NodeResponse], node_name: str) -> Optional[NodeResponse]:
        for node in reversed(node_responses):
            if node.node_name == node_name:
                return node
        return None

    def get_node_reference(self, node_responses: List[NodeResponse], node_name: str) -> Optional[References]:
        node = self.get_last_node_by_name(node_responses, node_name)
        if node:
            return node.references
        LOGGER.error(f"No node found with name: {node_name}")
        return None
    

def generate_node_responses_summary(
    node_responses: List[NodeResponse], 
    verbose: bool = False,
    output_prompt: Optional[Prompt] = None
) -> str:
    """
    Generate a summary of node responses, optionally using a template.
    
    Args:
        node_responses: List of node responses to summarize
        verbose: Whether to include detailed information
        output_prompt: Optional prompt template to format the output
        
    Returns:
        Formatted summary string
    """
    if output_prompt:
        try:
            # Extract variables from node responses
            prompt_vars = {}
            for param_name in output_prompt.input_variables:
                matching_node = next(
                    (node for node in reversed(node_responses)
                     if node.node_name == param_name and node.references),
                    None
                )
                if matching_node:
                    value = matching_node.references.detailed_summary()
                    prompt_vars[param_name] = value
                elif param_name in output_prompt.parameters.properties:
                    param_def = output_prompt.parameters.properties[param_name]
                    if param_def.default is not None:
                        prompt_vars[param_name] = param_def.default
                    else:
                        LOGGER.warning(f"Missing required parameter {param_name} for output template")
                        return generate_default_summary(node_responses, verbose)
            
            return output_prompt.format_prompt(**prompt_vars)
            
        except Exception as e:
            LOGGER.error(f"Error formatting output with template: {str(e)}")
            return generate_default_summary(node_responses, verbose)
    
    return generate_default_summary(node_responses, verbose)
    
def validate_and_process_function_inputs(
    params: FunctionParameters,
    execution_history: List[NodeResponse],
    kwargs: Dict[str, Any]
) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Validates and processes input parameters against a FunctionParameters definition.
    
    Args:
        params: FunctionParameters object defining expected inputs
        execution_history: Previous execution history to check for variable values
        kwargs: Input parameters to validate and process
        
    Returns:
        Tuple containing processed inputs dict and error message (if any)
    """
    processed_inputs = kwargs.copy()

    # Check each required parameter
    for param_name in params.required:
        # Skip if already in kwargs and no matching node exists
        if param_name in processed_inputs and not any(
            node.node_name == param_name for node in execution_history
        ):
            continue

        # Look for matching node in history
        matching_node = next(
            (node for node in reversed(execution_history)
             if node.node_name == param_name and node.references),
            None
        )

        if matching_node:
            try:
                # Get value from node references
                value = matching_node.references.detailed_summary()
                param_def = params.properties[param_name]
                
                # Convert to the correct type
                processed_inputs[param_name] = convert_value_to_type(
                    value=value,
                    param_name=param_name,
                    param_type=param_def.type
                )
                LOGGER.debug(f"Using value from node {param_name} in execution history")
            except (ValueError, TypeError) as e:
                return {}, f"Error converting value for parameter '{param_name}': {str(e)}"
        
        # If still not found, check for default value
        elif param_name not in processed_inputs:
            param_def = params.properties[param_name]
            if param_def.default is not None:
                processed_inputs[param_name] = param_def.default
            else:
                return {}, f"Missing required parameter: {param_name}"

    # Validate and convert all provided inputs
    for param_name, param_value in list(processed_inputs.items()):
        if param_name in params.properties:
            param_def = params.properties[param_name]
            try:
                processed_inputs[param_name] = convert_value_to_type(
                    value=param_value,
                    param_name=param_name,
                    param_type=param_def.type
                )
            except (ValueError, TypeError) as e:
                return {}, f"Invalid value for parameter '{param_name}': {str(e)}"

    return processed_inputs, None