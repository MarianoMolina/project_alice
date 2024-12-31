from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from pydantic import BaseModel, Field, model_validator
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager, APIEngine
from workflow.core.data_structures import (
    ApiType,
    FunctionParameters,
    ParameterDefinition,
    FunctionConfig,
    ToolFunction,
    References,
    TaskResponse,
    DataCluster,
    NodeResponse,
    UserInteraction,
    UserCheckpoint,
    NodeResponse,
    TasksEndCodeRouting,
    Prompt,
    BaseDataStructure,
)
from workflow.util import LOGGER, convert_value_to_type, get_traceback
from workflow.core.tasks.task_utils import (
    validate_and_process_function_inputs,
    generate_node_responses_summary,
    simplify_execution_history,
)


class AliceTask(BaseDataStructure):
    """
    Base class for all tasks in the Alice workflow system, providing a robust foundation for
    node-based execution with built-in support for recursion, API validation, and user interactions.

    AliceTask implements a flexible node-based execution model where each task can consist of multiple
    nodes that execute in sequence based on configurable routing rules. The execution flow is determined
    by exit codes and can include conditional branching, retries, and user checkpoints.

    Key Features:
    -------------
    * Node-Based Execution:
        - Tasks are divided into nodes that execute sequentially
        - Node routing is controlled by exit codes and routing rules
        - Support for conditional execution paths and retries

    * User Interaction:
        - Built-in support for user checkpoints
        - Configurable interaction points within task flow
        - Structured handling of user responses

    * API Integration:
        - Automatic validation of required APIs
        - Integration with multiple API types
        - Standardized API interaction patterns

    * Input/Output Management:
        - Structured parameter validation
        - Type checking and conversion
        - Flexible output formatting

    Attributes:
    -----------
    id : Optional[str]
        Unique identifier for the task

    task_name : str
        Name of the task

    task_description : str
        Clear description of the task's purpose

    start_node : Optional[str]
        Name of the initial node to execute

    recursive : bool
        Whether the task can execute nodes recursively (default: True)

    max_attempts : int
        Maximum number of attempts per node before failure (default: 1)

    node_end_code_routing : TasksEndCodeRouting
        Dictionary defining routing rules between nodes based on exit codes

    user_checkpoints : Dict[str, UserCheckpoint]
        Node-specific user interaction checkpoints

    input_variables : FunctionParameters
        Expected input structure for the task

    exit_codes : Dict[int, str]
        Mapping of exit codes to their descriptions

    required_apis : List[ApiType]
        List of required API types for the task

    templates : Dict[str, Prompt]
        Task prompt templates, including output formatting

    tasks : Dict[str, AliceTask]
        Subtasks that can be executed as part of this task

    Example:
    --------
    ```python
    class CustomTask(AliceTask):
        def __init__(self):
            super().__init__(
                task_name="custom_task",
                task_description="A custom task implementation",
                node_end_code_routing={
                    'node1': {
                        0: ('node2', False),  # Success, proceed to node2
                        1: ('node1', True)    # Failure, retry node1
                    },
                    'node2': {
                        0: (None, False),     # Success, end task
                        1: ('node1', False)   # Failure, return to node1
                    }
                }
            )

        async def execute_node1(self, execution_history, node_responses, **kwargs):
            # Node implementation
            pass

        async def execute_node2(self, execution_history, node_responses, **kwargs):
            # Node implementation
            pass
    ```

    Notes:
    ------
    1. Node Implementation:
        - Each node should be implemented as an async method named `execute_<node_name>`
        - Nodes must return NodeResponse objects indicating success/failure
        - Node execution order is determined by routing rules

    2. Error Handling:
        - Tasks should use the built-in retry mechanism for recoverable errors
        - Unrecoverable errors should be captured in NodeResponse objects
        - Maximum retry attempts are enforced automatically

    3. User Interaction:
        - User checkpoints can be added to any node
        - Responses are automatically handled in the execution flow
        - Task execution pauses at checkpoints until user input is received
    """

    # Basic task debugrmation
    id: Optional[str] = Field(default=None, description="Task ID", alias="_id")
    task_name: str = Field(..., description="Name of the task")
    task_description: str = Field(..., description="Clear description of task purpose")

    # Execution control
    start_node: Optional[str] = Field(default=None, description="Starting node name")
    recursive: bool = Field(
        True, description="Whether task can be executed recursively"
    )
    max_attempts: int = Field(1, description="Maximum attempts per node before failure")

    # Node and execution routing
    node_end_code_routing: TasksEndCodeRouting = Field(
        default={}, description="Routing rules between nodes based on exit codes"
    )
    user_checkpoints: Dict[str, UserCheckpoint] = Field(
        default_factory=dict, description="Node-specific user interaction checkpoints"
    )

    # Task configuration
    input_variables: FunctionParameters = Field(
        default_factory=lambda: FunctionParameters(
            type="object",
            properties={
                "prompt": ParameterDefinition(
                    type="string", description="Input prompt", default=None
                )
            },
            required=["prompt"],
        ),
        description="Expected input structure",
    )
    exit_codes: Dict[int, str] = Field(
        default_factory=lambda: {0: "Success", 1: "Failed"},
        description="Exit code options and descriptions",
    )
    required_apis: List[ApiType] = Field(
        default_factory=list, description="Required API types"
    )
    exit_code_response_map: Optional[Dict[str, int]] = Field(
        default=None,
        description="A dictionary of exit codes mapped to string responses for the task.",
    )

    # Task components
    templates: Dict[str, Prompt] = Field(
        default_factory=dict,
        description="Task prompt templates. output_template is used to format task output.",
    )
    tasks: Dict[str, "AliceTask"] = Field(default_factory=dict, description="Subtasks")
    agent: Optional[AliceAgent] = Field(default=None, description="Associated agent")
    api_engine: Optional[APIEngine] = Field(
        default=None, description="Associated API engine"
    )
    data_cluster: Optional[DataCluster] = Field(
        default=None, description="Associated data cluster"
    )

    @property
    def task_type(self) -> str:
        return self.__class__.__name__

    # Model validation
    @model_validator(mode="before")
    def convert_routing_lists_to_tuples(cls, values):
        """
        Converts list-format routing values from database to tuples for internal use.
        Handles both string-keyed and int-keyed dictionaries with robust error handling.
        """
        routing = values.get("node_end_code_routing")
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
                                LOGGER.warning(
                                    f"Invalid route format for {node}.{code}: {route}"
                                )
                                continue

                            first_elem = route[0] if route[0] is not None else None
                            second_elem = bool(route[1])  # Ensure boolean
                            converted_routes[code_key] = (first_elem, second_elem)

                        elif isinstance(route, dict):
                            # Handle possible dictionary format
                            first_elem = (
                                route.get(0) if route.get(0) is not None else None
                            )
                            second_elem = bool(route.get(1, False))
                            converted_routes[code_key] = (first_elem, second_elem)

                        else:
                            LOGGER.warning(
                                f"Unexpected route format for {node}.{code}: {route}"
                            )
                            continue

                    except (ValueError, TypeError, IndexError) as e:
                        LOGGER.error(
                            f"Error processing route for {node}.{code}: {str(e)}"
                        )
                        continue

                if converted_routes:  # Only add if we have valid routes
                    converted_routing[node] = converted_routes
                else:
                    LOGGER.warning(f"No valid routes found for node {node}")

            LOGGER.debug(f"Converted routing: {converted_routing}")
            values["node_end_code_routing"] = converted_routing

        except Exception as e:
            LOGGER.error(f"Error converting routing data: {str(e)}")
            LOGGER.error(f"Original routing data: {routing}")
            raise ValueError(f"Failed to process routing configuration: {str(e)}")

        return values

    def model_dump(self, *args, exclude=None, **kwargs):
        """
        Serializes the AliceTask instance to a dictionary, ensuring proper handling of:
        1. Nested BaseModel instances (propagating args/kwargs)
        2. Enum values (converting to their string values)
        3. Special fields like task_type
        4. Removing api_engine from the output
        5. Special handling for tasks to avoid recursion issues

        Returns:
            dict: The serialized AliceTask instance
        """
        LOGGER.debug(f"AliceTask.model_dump called for {self.__class__.__name__}")
        LOGGER.debug(f"Dict keys: {list(self.__dict__.keys())}")

        # Create exclude set if not provided
        if exclude is None:
            exclude = set()
        exclude.add("tasks")  # Exclude tasks from standard serialization

        try:
            data = super().model_dump(*args, exclude=exclude, **kwargs)
            LOGGER.debug(f"AliceTask base dump succeeded")
        except TypeError as e:
            LOGGER.error(f"TypeError in AliceTask model_dump: {str(e)}")
            LOGGER.error(f"Full task state: {vars(self)}")
            raise

        # Add task_type
        data["task_type"] = self.task_type

        # Handle tasks separately
        if self.tasks:
            data["tasks"] = {
                task_id: (
                    task.model_dump(*args, **kwargs)
                    if isinstance(task, BaseModel)
                    else task
                )
                for task_id, task in self.tasks.items()
            }

        # Handle remaining nested BaseModel instances in dictionaries
        if self.templates:
            data["templates"] = {
                template_id: (
                    template.model_dump(*args, **kwargs)
                    if isinstance(template, BaseModel)
                    else template
                )
                for template_id, template in self.templates.items()
            }

        if self.user_checkpoints:
            data["user_checkpoints"] = {
                checkpoint_id: (
                    checkpoint.model_dump(*args, **kwargs)
                    if isinstance(checkpoint, BaseModel)
                    else checkpoint
                )
                for checkpoint_id, checkpoint in self.user_checkpoints.items()
            }

        # Handle individual BaseModel instances
        if self.agent and isinstance(self.agent, BaseModel):
            data["agent"] = self.agent.model_dump(*args, **kwargs)

        if self.data_cluster and isinstance(self.data_cluster, BaseModel):
            data["data_cluster"] = self.data_cluster.model_dump(*args, **kwargs)

        if self.input_variables and isinstance(self.input_variables, BaseModel):
            data["input_variables"] = self.input_variables.model_dump(*args, **kwargs)

        # Handle Enum lists (required_apis)
        if data.get("required_apis"):
            data["required_apis"] = [
                api.value if isinstance(api, Enum) else api
                for api in data["required_apis"]
            ]

        # Remove api_engine if present
        data.pop("api_engine", None)

        return data

    # Execution methods
    async def run(
        self,
        execution_history: Optional[List[NodeResponse]] = None,
        node_responses: Optional[List[NodeResponse]] = None,
        data_cluster: Optional[References] = None,
        **kwargs,
    ) -> TaskResponse:
        """
        Execute the complete task with full node-based flow control and state management.

        This method orchestrates the entire task execution process, managing:
        1. Input validation and processing
        2. API availability verification
        3. Node-based execution flow
        4. State tracking and history management
        5. Error handling and recovery
        6. Final response generation

        The execution flow follows these steps:
        1. Validates and processes all input parameters
        2. Verifies availability of required APIs
        3. Determines the starting node based on execution history
        4. Executes nodes in sequence based on routing rules
        5. Handles user interactions when encountered
        6. Generates appropriate final response

        Args:
            execution_history (Optional[List[NodeResponse]]): Previous execution history
            node_responses (Optional[List[NodeResponse]]): Previous node responses
            data_cluster (Optional[References]): Associated data cluster for the task
            **kwargs: Task input parameters, including api_manager and any task-specific inputs

        Returns:
            TaskResponse: Object containing:
                - Task execution results and status
                - Complete execution history
                - Node responses
                - Error diagnostics if applicable
                - Output formatted according to task template

        Raises:
            ValueError: If input validation fails or required APIs are unavailable

        Notes:
            - The method maintains execution state through node responses
            - User interactions pause execution until response received
            - API validation occurs before any node execution
            - Node routing follows configured routing rules
            - Execution history is preserved in the response

        Example:
            ```python
            # Execute a task
            response = await task.run(
                api_manager=api_manager,
                prompt="Example input",
                custom_param="value"
            )

            if response.status == "complete":
                # Process successful execution
                print(response.task_outputs)
            elif response.status == "pending":
                # Handle user interaction required
                pass
            else:
                # Handle failure
                print(response.result_diagnostic)
            ```
        """
        execution_history = execution_history or []
        node_responses: List[NodeResponse] = node_responses or []

        try:
            # Validate and process inputs
            processed_inputs, error_msg = validate_and_process_function_inputs(
                params=self.input_variables,
                execution_history=execution_history,
                kwargs=kwargs,
            )
            if error_msg:
                return self.get_failed_task_response(error_msg, **kwargs)

            # Update kwargs with processed inputs
            kwargs.update(processed_inputs)

            # Validate required APIs
            if self.required_apis:
                api_manager = kwargs.get("api_manager")
                if not api_manager:
                    return self.get_failed_task_response(
                        "API manager not provided", **kwargs
                    )
                if not self.validate_required_apis(api_manager):
                    return self.get_failed_task_response(
                        "Required APIs not available", **kwargs
                    )

            # Determine starting node based on execution history
            current_node = self.resolve_next_node(execution_history)
            LOGGER.debug(f'Starting task "{self.task_name}" from node "{current_node}"')

            # Execute nodes
            while current_node:
                # Execute current node
                node_response = await self.execute_node(
                    current_node, execution_history, node_responses, **kwargs
                )

                # Handle user interaction
                if (
                    node_response.references
                    and node_response.references.user_interactions
                ):
                    LOGGER.debug(f"User interaction detected for node {current_node}")
                    LOGGER.debug(
                        f"Node response user interaction: {node_response.references.user_interactions[0]}"
                    )
                    node_responses.append(node_response)
                    return self.create_partial_response(
                        node_responses, "pending", **kwargs
                    )

                execution_history.append(node_response)
                node_responses.append(node_response)

                # Get next node
                next_node, is_retry = self.get_next_node(node_response)
                if is_retry:
                    if not self.can_retry_node(next_node, execution_history):
                        LOGGER.warning(f"Cannot retry node {next_node}")
                        break
                current_node = next_node
            return self.create_final_response(
                node_responses, execution_history=execution_history, **kwargs
            )

        except Exception as e:
            LOGGER.error(
                f"Error executing task {self.task_name}: {str(e)}\n{get_traceback()}"
            )
            return self.get_failed_task_response(str(e) + get_traceback(), **kwargs)

    async def execute_node(
        self,
        node_name: str,
        execution_history: List[NodeResponse],
        node_responses: List[NodeResponse],
        **kwargs,
    ) -> NodeResponse:
        """
        Execute a single node within the task, handling user checkpoints and method routing.

        This method serves as the central execution point for individual nodes within a task.
        It handles:
        1. User checkpoint verification and processing
        2. Dynamic method routing to node-specific implementations
        3. Result capture and error handling
        4. Variable updates based on node outputs

        The method follows these steps:
        1. Checks for and handles any user checkpoints for the node
        2. Locates and validates the node's implementation method
        3. Executes the node implementation with provided context
        4. Updates any matching variables in kwargs with node outputs
        5. Returns a structured response containing execution results

        Args:
            node_name (str): Name of the node to execute, corresponding to an `execute_<node_name>` method
            execution_history (List[NodeResponse]): Complete history of all node executions in this task
            node_responses (List[NodeResponse]): List of responses from nodes executed in current task
            **kwargs: Additional keyword arguments passed to the node implementation

        Returns:
            NodeResponse: Object containing:
                - parent_task_id: ID of the parent task
                - node_name: Name of the executed node
                - execution_order: Order of execution in the sequence
                - exit_code: Result code (0 for success)
                - references: Any output data or messages

        Raises:
            Exception: If node execution fails, returns NodeResponse with error details

        Notes:
            - Node implementations should be methods named `execute_<node_name>`
            - User checkpoints take precedence over node execution
            - Node output can update variables if their names match input parameters
            - All errors are captured and returned in NodeResponse format

        Example:
            ```python
            # Within a task execution:
            node_response = await self.execute_node(
                node_name="process_data",
                execution_history=history,
                node_responses=responses,
                data_input="example"
            )
            if node_response.exit_code == 0:
                # Process successful node execution
                pass
            ```
        """
        # Check for user interaction
        user_interaction = self.handle_user_checkpoints(execution_history, node_name)
        if user_interaction:
            return user_interaction

        # Get node method
        method_name = f"execute_{node_name}"
        if not hasattr(self, method_name):
            LOGGER.error(
                f"No implementation found for node {node_name} as method_name {method_name} in task {self.task_name}"
            )
            LOGGER.debug(f"Available methods: {dir(self)}")
            LOGGER.debug(f"Self class: {self.__class__.__name__}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=1,
                references=References(
                    messages=[
                        {
                            "role": "system",
                            "content": f"No implementation found for node {node_name} in task {self.task_name}",
                            "generated_by": "system",
                        }
                    ]
                ),
                execution_order=len(execution_history),
            )

        # Execute node method
        try:
            node_response: NodeResponse = await getattr(self, method_name)(
                execution_history, node_responses, **kwargs
            )
            # Update kwargs if node name exists as a variable
            if node_name in kwargs:
                try:
                    value = node_response.references.detailed_summary()
                    if node_name in self.input_variables.properties:
                        param_type = self.input_variables.properties[node_name].type
                        kwargs[node_name] = convert_value_to_type(
                            value, node_name, param_type
                        )
                    else:
                        kwargs[node_name] = value
                    LOGGER.debug(f"Updated variable {node_name} with node output")
                except (ValueError, TypeError) as e:
                    LOGGER.warning(
                        f"Failed to update variable {node_name} with node output: {e}"
                    )

            return node_response
        except Exception as e:
            LOGGER.error(f"Error executing node {node_name}: {str(e)}")
            return NodeResponse(
                parent_task_id=self.id,
                node_name=node_name,
                exit_code=1,
                references=References(
                    messages=[
                        {
                            "role": "system",
                            "content": f"Error in node {node_name}: {str(e)}\n\n"
                            + get_traceback(),
                            "generated_by": "system",
                        }
                    ]
                ),
                execution_order=len(execution_history),
            )

    async def run_from_task_response(
        self, task_response: TaskResponse, **kwargs
    ) -> TaskResponse:
        """
        Continues execution of a task from a previous TaskResponse.

        This method is particularly useful for handling tasks that were paused
        due to user interactions and need to be resumed after receiving user input.

        Args:
            task_response (TaskResponse): Previous task response to continue from
            **kwargs: Additional task parameters

        Returns:
            TaskResponse: Updated task response after continuing execution
        """
        # Validate task response status
        if task_response.status != "pending":
            LOGGER.warning(
                f"Task {self.task_name} is not pending (status: {task_response.status})"
            )
            return task_response

        # Get execution history from task response
        node_responses = task_response.node_references or []
        execution_history = node_responses

        # Update task inputs with original inputs
        if task_response.task_inputs:
            kwargs.update(task_response.task_inputs)

        # Continue task execution
        return await self.run(
            execution_history=execution_history, node_responses=node_responses, **kwargs
        )

    # User interaction handling
    def handle_user_checkpoints(
        self, execution_history: List[NodeResponse] = None, node_name: str = None
    ) -> Optional[NodeResponse]:
        """
        Handles user checkpoints. This method can be called by subclasses before their specific logic.
        Returns a NodeResponse if a user interaction is needed, None otherwise.
        """
        execution_history = execution_history or []
        node_name = node_name or self.start_node or "default"
        LOGGER.debug(f"Checking user checkpoints for node {node_name}")

        if node_name in self.user_checkpoints:
            completed_interaction = next(
                (
                    node
                    for node in reversed(execution_history)
                    if node.node_name == node_name
                    and node.references.user_interactions
                    and node.references.user_interactions[-1].user_response is not None
                ),
                None,
            )

            if not completed_interaction:
                LOGGER.debug(f"Creating user interaction for node {node_name}")
                return self.create_user_interaction(node_name, len(execution_history))
        return None

    def create_user_interaction(
        self, node_name: str, execution_order: int
    ) -> NodeResponse:
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
            user_checkpoint_id=checkpoint,
        )

        return NodeResponse(
            parent_task_id=self.id,
            node_name=node_name,
            execution_order=execution_order,
            references=References(user_interactions=[user_interaction]),
            exit_code=0,
        )

    # Execution tracking
    def count_node_attempts(
        self, node_name: str, execution_history: List[NodeResponse]
    ) -> int:
        """Count previous attempts for a specific node in this task."""
        return sum(
            1
            for node in execution_history
            if node.parent_task_id == self.id
            and node.node_name == node_name
            and self.is_exit_code_retry(node.node_name, node.exit_code)
        )

    def is_exit_code_retry(self, node_name: str, exit_code: int) -> bool:
        """Determine if an exit code constitutes a retry for a specific node."""
        if node_name not in self.node_end_code_routing:
            LOGGER.warning(
                f"No routing rules found for node {node_name} in {self.task_name} with end_code_routing: {self.node_end_code_routing}"
            )
            return True

        return self.node_end_code_routing[node_name].get(exit_code, (None, False))[1]

    def can_retry_node(
        self, node_name: str, execution_history: List[NodeResponse]
    ) -> bool:
        """Determine if a node can be retried based on attempts and recursion settings."""
        attempts = self.count_node_attempts(node_name, execution_history)

        if attempts >= self.max_attempts:
            LOGGER.warning(
                f"Node {node_name} has reached maximum attempts ({self.max_attempts})"
            )
            return False

        if not self.recursive and attempts > 0:
            LOGGER.warning(
                f"Node {node_name} cannot be retried as task is not recursive"
            )
            return False

        return True

    def get_next_node(self, current_node: NodeResponse) -> Tuple[Optional[str], bool]:
        """
        Direct lookup of routing rules to detect task progression or completion.

        Checks the routing table to determine:
        1. Whether current node completes the task (returns None)
        2. What the next node should be if task continues
        3. Whether next node should be treated as a retry

        Args:
            current_node: The node response from which to determine routing

        Returns:
            Tuple[Optional[str], bool]: 
                - Tuple of (None, False) if this node completes the task execution
                - Tuple of (next_node_name, is_retry) if task should continue
        """
        if not current_node:
            return None

        if current_node.node_name not in self.node_end_code_routing:
            return None

        routing = self.node_end_code_routing[current_node.node_name]
        return routing.get(current_node.exit_code, (None, False))

    def resolve_next_node(
        self, execution_history: List[NodeResponse]
    ) -> str:
        """
        ALWAYS returns a valid next node to execute.
        
        Determines the next node to execute based on execution history:
        - Uses routing rules to determine next node in current task execution
        - When get_next_node signals end-of-task (by returning None), initiates a new 
          task execution by returning start_node
        - Handles user interaction checkpoints if present
        - Ignores retry flags (will return the next node even if marked for retry)

        Args:
            execution_history: List of previous node executions

        Returns:
            str: Name of the next node to execute. Always returns a valid node name, 
                initiating new task execution when needed.
        """
        # Find the last node from this task
        last_task_node = next(
            (
                node
                for node in reversed(execution_history)
                if node.parent_task_id == self.id
            ),
            None,
        )

        if last_task_node:
            # If node has a user interaction with response, get next node from interaction
            if (
                last_task_node.references
                and last_task_node.references.user_interactions
            ):
                user_interaction = last_task_node.references.user_interactions[-1]
                if user_interaction.user_response:
                    checkpoint = self.user_checkpoints.get(last_task_node.node_name)
                    if checkpoint:
                        selected_option = user_interaction.user_response.selected_option
                        return checkpoint.task_next_obj.get(selected_option)

            # Otherwise use standard routing logic
            next_node = self.get_next_node(last_task_node)[0]
            if next_node is None:
                return self.start_node or next(iter(self.node_end_code_routing.keys()))
            return next_node 
        # If no previous nodes from this task, return start node or first available
        return self.start_node or next(iter(self.node_end_code_routing.keys()))

    def collect_metadata(self, node_responses: NodeResponse) -> Dict[str, Any]:
        """
        Collects metadata from node responses, only creating dictionary entries for metrics that have data.
        
        Args:
            node_responses (NodeResponse): List of node responses containing references with potential metadata
            
        Returns:
            Dict[str, Any]: Dictionary containing only metrics that have data
        """
        usage_metrics = {}
        for node in node_responses:
            if node.references:
                if node.references.messages:
                    for message in node.references.messages:
                        if message.creation_metadata:
                            if "messages" not in usage_metrics:
                                usage_metrics["messages"] = []
                            usage_metrics["messages"].append(message.creation_metadata)
                            
                if node.references.files:
                    for file in node.references.files:
                        if file.transcript and file.transcript.creation_metadata:
                            if "files" not in usage_metrics:
                                usage_metrics["files"] = []
                            usage_metrics["files"].append(file.transcript.creation_metadata)
                            
                if node.references.embeddings:
                    for embedding in node.references.embeddings:
                        if embedding.creation_metadata:
                            if "embeddings" not in usage_metrics:
                                usage_metrics["embeddings"] = []
                            usage_metrics["embeddings"].append(embedding.creation_metadata)
                            
                if node.references.entity_references:
                    for entity in node.references.entity_references:
                        if entity.metadata and 'creation_metadata' in entity.metadata:
                            if "entity_references" not in usage_metrics:
                                usage_metrics["entity_references"] = []
                            usage_metrics["entity_references"].append(entity.metadata["creation_metadata"])
                            
                if node.references.task_responses:
                    for task_response in node.references.task_responses:
                        if task_response.usage_metrics:
                            if "task_responses" not in usage_metrics:
                                usage_metrics["task_responses"] = []
                            usage_metrics["task_responses"].append(task_response.usage_metrics)
                            
        return usage_metrics

    # Response creation methods
    def get_task_response(
        self,
        task_outputs: str,
        result_code: int,
        diagnostics: str = None,
        status: str = "complete",
        node_references: List[NodeResponse] = None,
        usage_metrics: Dict[str, Any] = None,
        **kwargs,
    ) -> TaskResponse:
        """Create a standardized task response."""
        exec_history = kwargs.pop("execution_history", None)
        if exec_history and isinstance(exec_history, list):
            exec_history = simplify_execution_history(exec_history)

        kwargs.pop("api_manager", None)

        return TaskResponse(
            task_id=self.id or "",
            task_name=self.task_name,
            task_description=self.task_description,
            status=status,
            result_code=result_code,
            task_outputs=task_outputs,
            task_inputs=kwargs,
            result_diagnostic=diagnostics,
            node_references=node_references or [],
            execution_history=exec_history,
            usage_metrics=usage_metrics,
        )

    def get_external_execution_history_length(
        self, execution_history: List[NodeResponse]
    ) -> int:
        """Get the length of the execution history that is external to this task."""
        return sum(1 for node in execution_history if node.parent_task_id != self.id)

    def create_partial_response(
        self, node_responses: List[NodeResponse], status: str, **kwargs
    ) -> TaskResponse:
        """Create a response for a partially completed task."""
        output_template = self.get_prompt_template("output_template")
        return self.get_task_response(
            task_outputs=generate_node_responses_summary(
                node_responses, True, output_template, **kwargs
            ),
            result_code=1,
            diagnostics="Task requires user interaction",
            status=status,
            node_references=node_responses,
            **kwargs,
        )

    def get_failed_task_response(
        self, diagnostics: str = None, **kwargs
    ) -> TaskResponse:
        """
        Returns a failed task response with the given diagnostics.
        """
        return self.get_task_response("", 1, diagnostics, "failed", **kwargs)

    def create_final_response(
        self,
        node_responses: List[NodeResponse],
        exit_code: Optional[int] = None,
        diagnostics: Optional[str] = None,
        **kwargs,
    ) -> TaskResponse:
        """
        Create a response for a completed task.

        The final exit code is determined by:
        1. Explicitly provided exit_code parameter
        2. Mapping via map_final_exit_code -> Default success/failure logic ->
            Success (0) if all their nodes have at least one node response with an exit code that doesn't constitute a 'retry', Failure (1) otherwise
        """
        if exit_code is None:
            exit_code = self.map_final_exit_code(node_responses)
            LOGGER.debug(f"Final exit code for task {self.task_name}: {exit_code}")

        if diagnostics is None:
            diagnostics = self.exit_codes.get(exit_code, "Task execution completed")

        # Try to use output template if available
        output_template = self.get_prompt_template("output_template")
        summary = generate_node_responses_summary(
            node_responses=node_responses,
            verbose=True,
            output_prompt=output_template,
            **kwargs,
        )

        return self.get_task_response(
            task_outputs=summary,
            result_code=exit_code,
            diagnostics=diagnostics,
            status="complete" if exit_code == 0 else "failed",
            node_references=node_responses,
            usage_metrics=self.collect_metadata(node_responses),
            **kwargs,
        )

    def map_final_exit_code(self, node_responses: List[NodeResponse]) -> int:
        """
        Map node responses to final task exit code.
        Override this method to implement custom exit code mapping.

        Updated implementation:
        - For each node, consider only its last execution
        - Returns the exit code of the last node if all nodes have the same exit code
        - Returns 1 only if any node's last exit code is not in its success codes
        - Returns 0 otherwise (including if no nodes exist)
        """
        # Build a dict of last node_responses for nodes in node_end_code_routing
        last_node_responses = {}
        for node in node_responses:
            if node.node_name in self.node_end_code_routing:
                last_node_responses[node.node_name] = node

        # Now get the set of exit codes from the last_node_responses
        exit_codes = set(node.exit_code for node in last_node_responses.values())
        if len(exit_codes) == 1:
            return next(iter(exit_codes))

        for node_name, node in last_node_responses.items():
            # Get all codes that don't retry (success codes)
            LOGGER.debug(f"Checking success codes for node {node_name}")
            success_codes = [
                code
                for code, (_, is_retry) in self.node_end_code_routing[node_name].items()
                if not is_retry
            ]
            LOGGER.debug(
                f"Node name: {node_name}\nExit code: {node.exit_code}\nSuccess codes: {success_codes}"
            )
            if node.exit_code not in success_codes:
                return 1
        return 0

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
            if api.api_config and api.api_config.health_status != "healthy":
                LOGGER.error(f"Required API {api_type} not healthy")
                return False

        return True

    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        result = {
            "task_name": self.task_name,
            "status": "valid",
            "warnings": [],
            "child_tasks": [],
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
                result["warnings"].append(
                    f"Warning in child task '{child_task_name}': {', '.join(child_result['warnings'])}"
                )

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
                    parameters=self.input_variables.model_dump(by_alias=True),
                ),
            ),
            "function_map": {self.task_name: function_callable},
        }

    # Utility methods
    def get_last_node_by_name(
        self, node_responses: List[NodeResponse], node_name: str
    ) -> Optional[NodeResponse]:
        for node in reversed(node_responses):
            if node.node_name == node_name:
                return node
        return None

    def get_node_reference(
        self, node_responses: List[NodeResponse], node_name: str
    ) -> Optional[References]:
        node = self.get_last_node_by_name(node_responses, node_name)
        if node:
            return node.references
        LOGGER.error(f"No node found with name: {node_name}")
        return None

    def _get_available_exit_code(self, desired_code: int, node_name: str) -> int:
        """
        Get the closest available exit code for a node.

        Args:
            desired_code: The preferred exit code
            node_name: The name of the node

        Returns:
            The closest available exit code, defaulting to 0 if the desired code
            isn't available and 0 is defined
        """
        if node_name not in self.node_end_code_routing:
            return 0

        available_codes = self.node_end_code_routing[node_name].keys()
        if not available_codes:
            return 0

        # If desired code is available, use it
        if desired_code in available_codes:
            return desired_code

        # If 0 is available, use it as default success code
        if 0 in available_codes:
            return 0

        # Return the lowest available code as last resort
        return min(available_codes)
