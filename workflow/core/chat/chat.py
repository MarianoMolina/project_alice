from enum import Enum
from pydantic import Field, model_validator, BaseModel
from typing import List, Optional, Dict, Any, Callable, Union
from workflow.util import LOGGER, get_traceback
from workflow.core.data_structures import (
    MessageDict, ContentType, ToolFunction,
    UserInteraction, UserCheckpoint, Prompt, User, 
    BaseDataStructure, DataCluster, InteractionOwner,
    InteractionOwnerType, MessageGenerators, RoleTypes,
    TaskResponse, CodeExecution, ChatThread
)
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager
from workflow.core.tasks import AliceTask, create_task_from_json

class CheckpointType(str, Enum):
    TOOL_CALL = "tool_call"
    CODE_EXECUTION = "code_execution"

class AliceChat(BaseDataStructure):
    """
    Represents a chat session with an AI assistant, managing the conversation flow and execution.

    This class encapsulates the properties and methods needed to create and manage
    a chat session, including the conversation history, associated agents, available
    agent_tools, and chat execution functionality.

    Attributes:
        id (Optional[str]): The unique identifier for the chat session.
        name (str): The name of the chat session.
        messages (Optional[List[MessageDict]]): List of messages in the conversation history.
        alice_agent (AliceAgent): The main AI agent for the chat.
        agent_tools (Optional[List[AliceTask]]): List of available tools/tasks for the agent.
        retrieval_tools (Optional[RetrievalTask]): Optional retrieval task for accessing data cluster.

    Methods:
        tool_list(api_manager: APIManager) -> List[FunctionConfig]:
            Returns a list of function configurations for the available tasks.
        tool_map(api_manager: APIManager) -> Optional[Dict[str, Callable]]:
            Combines all available function maps from the registered tasks.
        generate_response(api_manager: APIManager, new_message: Optional[str] = None) -> List[MessageDict]:
            Generates a response in the chat, processing any new user message.
        deep_validate_required_apis(api_manager: APIManager) -> Dict[str, Any]:
            Performs a deep validation of all required APIs for the chat and its agent_tools.
    """
    id: Optional[str] = Field(default=None, description="The unique ID of the chat conversation", alias="_id")
    name: str = Field("New Chat", description="The name of the chat conversation")
    messages: List[MessageDict] = Field(default_factory=list, description="List of messages in the chat conversation")
    threads: List[ChatThread] = Field(default_factory=list, description="List of chat threads")
    alice_agent: AliceAgent = Field(
        default=AliceAgent(
            name="Alice",
            system_message=Prompt(
                name="alice_default",
                content="You are Alice, an AI personal assistant powered by a suite of tools."
            ),
        ),
        description="The Alice agent for this chat session"
    )
    agent_tools: List[AliceTask] = Field(
        default_factory=list, 
        description="Available tools for the agent"
    )
    retrieval_tools: List[AliceTask] = Field(
        default_factory=list, 
        description="Tools for accessing the data cluster"
    )
    default_user_checkpoints: Dict[CheckpointType, UserCheckpoint] = Field(..., description="Default checkpoints for user interactions")
    data_cluster: Optional[DataCluster] = Field(
        default=None,
        description="Associated data cluster"
    )
    
    @model_validator(mode='before')
    @classmethod
    def initialize_threads(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize chat threads before model creation.
        
        This validator:
        1. Ensures thread list is properly initialized
        2. Converts dictionary items to appropriate thread instances
        
        Args:
            values: Dictionary of field values to validate
            
        Returns:
            Dict[str, Any]: Updated values dictionary with properly initialized threads
            
        Raises:
            ValueError: If thread conversion fails
        """
        # Initialize empty list if not present
        threads = values.get('threads', [])
        
        # Ensure we have a list
        if not isinstance(threads, list):
            threads = []
            
        # Process threads
        processed_threads = []
        for thread in threads:
            if isinstance(thread, dict):
                try:
                    processed_thread = ChatThread(**thread)
                    processed_threads.append(processed_thread)
                except Exception as e:
                    LOGGER.error(f"Failed to create chat thread: {str(e)}")
                    raise ValueError(f"Failed to create chat thread: {str(e)}")
            elif isinstance(thread, ChatThread):
                processed_threads.append(thread)
            else:
                LOGGER.error(f"Invalid chat thread type: {type(thread)}")
                raise ValueError(f"Invalid chat thread type: {type(thread)}")

        # Update values with processed threads
        values['threads'] = processed_threads
        
        LOGGER.debug(f"Initialized threads: {processed_threads}")
        
        return values

    @model_validator(mode='before')
    @classmethod
    def initialize_tools(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize agent_tools and retrieval_tools before model creation.
        
        This validator:
        1. Ensures tool lists are properly initialized
        2. Converts dictionary items to appropriate task instances using create_task_from_json
        3. Validates all items are valid task instances
        
        Args:
            values: Dictionary of field values to validate
            
        Returns:
            Dict[str, Any]: Updated values dictionary with properly initialized tools
            
        Raises:
            ValueError: If tool conversion or validation fails
        """
        # Initialize empty lists if not present
        agent_tools = values.get('agent_tools', [])
        retrieval_tools = values.get('retrieval_tools', [])
        
        # Ensure we have lists
        if not isinstance(agent_tools, list):
            agent_tools = []
        if not isinstance(retrieval_tools, list):
            retrieval_tools = []
            
        # Process agent tools
        processed_agent_tools = []
        for tool in agent_tools:
            if isinstance(tool, dict):
                try:
                    processed_tool = create_task_from_json(tool)
                    processed_agent_tools.append(processed_tool)
                except Exception as e:
                    LOGGER.error(f"Failed to create agent tool: {str(e)}")
                    raise ValueError(f"Failed to create agent tool: {str(e)}")
            elif isinstance(tool, AliceTask):
                processed_agent_tools.append(tool)
            else:
                LOGGER.error(f"Invalid agent tool type: {type(tool)}")
                raise ValueError(f"Invalid agent tool type: {type(tool)}")
                
        # Process retrieval tools
        processed_retrieval_tools = []
        for tool in retrieval_tools:
            if isinstance(tool, dict):
                try:
                    processed_tool = create_task_from_json(tool)
                    processed_retrieval_tools.append(processed_tool)
                except Exception as e:
                    LOGGER.error(f"Failed to create retrieval tool: {str(e)}")
                    raise ValueError(f"Failed to create retrieval tool: {str(e)}")
            elif isinstance(tool, AliceTask):
                processed_retrieval_tools.append(tool)
            else:
                LOGGER.error(f"Invalid retrieval tool type: {type(tool)}")
                raise ValueError(f"Invalid retrieval tool type: {type(tool)}")

        # Update values with processed tools
        values['agent_tools'] = processed_agent_tools
        values['retrieval_tools'] = processed_retrieval_tools
        
        LOGGER.debug(f"Initialized agent_tools: {processed_agent_tools} with task types {[tool.__class__.__name__ for tool in processed_agent_tools]}")
        LOGGER.debug(f"Initialized retrieval_tools: {processed_retrieval_tools} with task types {[tool.__class__.__name__ for tool in processed_retrieval_tools]}")
        
        return values

    def model_dump(self, *args, **kwargs):
        """
        Serializes the AliceChat instance to a dictionary, ensuring proper handling of:
        1. Nested BaseModel instances (passing through args/kwargs)
        2. Enum values (converting to their string values)
        3. Special fields like task_type
        4. Removing api_engine from the output

        Returns:
            dict: The serialized AliceChat instance
        """
        # Create a copy of kwargs to modify for super() call
        super_kwargs = kwargs.copy()
        
        # Add exclude field to prevent double serialization
        exclude = super_kwargs.get('exclude', set())
        fields_to_exclude = {
            'messages', 
            'agent_tools', 
            'threads',
            'retrieval_tools', 
            'alice_agent', 
            'data_cluster',
            'default_user_checkpoints'
        }
        super_kwargs['exclude'] = exclude.union(fields_to_exclude)
        
        # Get base data from parent class, excluding our custom-handled fields
        data = super().model_dump(*args, **super_kwargs)
        
        # Manually handle special fields
        if self.messages:
            data['messages'] = [
                msg.model_dump(*args, **kwargs) if isinstance(msg, BaseModel) else msg 
                for msg in self.messages
            ]
        if self.threads:
            data['threads'] = [
                thread.model_dump(*args, **kwargs) if isinstance(thread, BaseModel) else thread
                for thread in self.threads
            ]
        
        if self.agent_tools:
            data['agent_tools'] = [
                tool.model_dump(*args, **kwargs) if isinstance(tool, BaseModel) else tool 
                for tool in self.agent_tools
            ]
            
        if self.retrieval_tools:
            data['retrieval_tools'] = [
                tool.model_dump(*args, **kwargs) if isinstance(tool, BaseModel) else tool 
                for tool in self.retrieval_tools
            ]

        if isinstance(self.alice_agent, BaseModel):
            data['alice_agent'] = self.alice_agent.model_dump(*args, **kwargs)
            
        if isinstance(self.data_cluster, BaseModel):
            data['data_cluster'] = self.data_cluster.model_dump(*args, **kwargs)

        if self.default_user_checkpoints:
            data['default_user_checkpoints'] = {
                key: checkpoint.model_dump(*args, **kwargs) if isinstance(checkpoint, BaseModel) else checkpoint
                for key, checkpoint in self.default_user_checkpoints.items()
            }

        return data

    async def generate_response(self, api_manager: APIManager, new_message: Optional[str] = None, user_data: Optional[User] = None, current_time: Optional[str] = None) -> List[MessageDict]:
        """Main entry point for generating responses in the chat."""
        try:               
            # Add new message if provided
            if new_message:
                self.messages.append(MessageDict(
                    role=RoleTypes.USER,
                    content=new_message,
                    generated_by=MessageGenerators.USER
                ))

            # Start new chat turn sequence
            return await self._execute_chat_turns(api_manager, user_data, current_time)
            
        except Exception as e:
            error_msg = f"Error in chat generate_response: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

    async def continue_user_interaction(self, api_manager: APIManager, interaction: UserInteraction) -> Optional[MessageDict]:
        """
        Process a specific user interaction, potentially from earlier in the conversation.
        
        Args:
            api_manager: The API manager instance
            interaction: The user interaction to process
            
        Returns:
            List[MessageDict]: Messages generated from processing the interaction
        """
        try:
            if not interaction.user_response:
                LOGGER.warning("Cannot continue user interaction without user response")
                return []

            # Verify this interaction belongs to this chat
            if interaction.owner.type != InteractionOwnerType.CHAT or interaction.owner.chat_id != self.id:
                LOGGER.error("Interaction does not belong to this chat")
                return []

            # Find the message containing this interaction
            target_message = self._find_message_with_interaction(interaction)
            if not target_message:
                LOGGER.error("Could not find message containing the interaction")
                return []

            # Get and validate next step
            next_step = interaction.user_checkpoint_id.task_next_obj.get(
                interaction.user_response.selected_option
            )

            if not next_step:
                LOGGER.debug("No next step defined for this response")
                return []

            if next_step not in [CheckpointType.TOOL_CALL, CheckpointType.CODE_EXECUTION]:
                LOGGER.error(f"Invalid next step defined: {next_step}")
                return []

            # Execute appropriate action
            if next_step == CheckpointType.TOOL_CALL and target_message.references.tool_calls:
                task_responses = await self._handle_tool_calls(
                    api_manager,
                    target_message.references.tool_calls
                )
                if not target_message.references.task_responses:
                    target_message.references.task_responses = []
                target_message.references.task_responses.extend(task_responses)
                return target_message
            elif next_step == CheckpointType.CODE_EXECUTION:
                code_blocks = self.alice_agent.collect_code_blocks([target_message])
                if code_blocks:
                    code_executions: List[CodeExecution] = await self._handle_code_execution(
                        [target_message]
                    )
                    if code_executions:
                        if not target_message.references.code_executions:
                            target_message.references.code_executions = []
                        target_message.references.code_executions.extend(code_executions)
                return target_message

        except Exception as e:
            error_msg = f"Error processing interaction: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            return self._create_error_message(error_msg)

        return None

    async def _execute_chat_turns(self, api_manager: APIManager, user_data: Optional[User] = None, current_time: Optional[str] = None) -> List[MessageDict]:
        """Execute a sequence of chat turns until completion or max turns reached."""
        all_generated_messages = []
        turn_count = 0
        
        while turn_count < self.alice_agent.max_consecutive_auto_reply:
            try:
                turn_message = await self._execute_single_turn(api_manager, all_generated_messages, user_data, current_time)
                
                if not turn_message:
                    break
                    
                all_generated_messages.append(turn_message)
                
                # Check for pending interaction
                if self._get_pending_interaction(turn_message):
                    break
                    
                # Check if we should continue
                if not self._should_continue_turns(turn_message):
                    break
                    
                turn_count += 1
                
            except Exception as e:
                error_msg = f"Error in turn {turn_count}: {str(e)}\n{get_traceback()}"
                LOGGER.error(error_msg)
                all_generated_messages.append(self._create_error_message(error_msg))
                break

        return all_generated_messages

    async def _execute_single_turn(self, api_manager: APIManager, previous_messages: List[MessageDict], user_data: Optional[User] = None, current_time: Optional[str] = None) -> MessageDict:
        """Execute a single turn of the conversation (LLM -> tools -> code)."""
        try:
            # Generate LLM response first
            llm_message = await self._generate_llm_response(
                api_manager,
                self.messages + previous_messages,
                self._get_available_tool_functions(api_manager),
                user_data=user_data,
                current_time=current_time
            )
            
            # If LLM generation failed, raise the exception
            if not llm_message:
                raise ValueError("Failed to generate LLM response")
                
            try:
                # Handle tool calls
                can_tool_call = self._can_tool_call(llm_message)
                if can_tool_call and not isinstance(can_tool_call, UserInteraction):
                    tool_responses: List[TaskResponse] = await self._handle_tool_calls(
                        api_manager,
                        llm_message.references.tool_calls
                    )
                    if tool_responses:
                        if not llm_message.references.task_responses:
                            llm_message.references.task_responses = []
                        llm_message.references.task_responses.extend(tool_responses)
                elif can_tool_call and isinstance(can_tool_call, UserInteraction):
                    if not llm_message.references.user_interactions:
                        llm_message.references.user_interactions = []
                    llm_message.references.user_interactions.append(can_tool_call)

                # Handle code execution
                can_execute_code = self._can_execute_code(llm_message)
                if can_execute_code and not isinstance(can_execute_code, UserInteraction):
                    code_executions: List[CodeExecution] = await self._handle_code_execution([llm_message], False)
                    if code_executions:
                        if not llm_message.references.code_executions:
                            llm_message.references.code_executions = []
                        llm_message.references.code_executions.extend(code_executions)
                elif can_execute_code and isinstance(can_execute_code, UserInteraction):
                    if not llm_message.references.user_interactions:
                        llm_message.references.user_interactions = []
                    llm_message.references.user_interactions.append(can_execute_code)
                    
                return llm_message
                
            except Exception as e:
                # If an error occurs after LLM message generation, append error to message
                error_msg = f"\n\nError during execution: {str(e)}\n{get_traceback()}"
                llm_message.content += error_msg
                LOGGER.error(f"Error in turn execution: {error_msg}")
                return llm_message

        except Exception as e:
            # If no LLM message was generated, raise the exception
            error_msg = f"Error in turn execution: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            raise
        
    def _can_tool_call(self, message: MessageDict) -> Union[bool, UserInteraction]:
        """Check if tool calls are allowed and return a pending interaction if needed."""
        if not message.references or not message.references.tool_calls or self.alice_agent.has_tools == 0  or self.alice_agent.has_tools == 3: # Disabled or dry run
            return False
        if self.alice_agent.has_tools == 2:  # WITH_PERMISSION
            # Create new interaction
            checkpoint = self.default_user_checkpoints.get(CheckpointType.TOOL_CALL)
            if not checkpoint:
                LOGGER.error("No default checkpoint defined for tool calls")
                return False
            return self._create_checkpoint_interaction(checkpoint)
        return True
    
    def _can_execute_code(self, message: MessageDict) -> Union[bool, UserInteraction]:
        """Check if code execution is allowed and return a pending interaction if needed."""
        
        code_blocks = self.alice_agent.collect_code_blocks([message])
        if not code_blocks or not message.references or not message.references.code_executions or self.alice_agent.has_code_exec == 0: # Disabled
            return False
        if self.alice_agent.has_code_exec == 2:  # WITH_PERMISSION
            # Create new interaction
            checkpoint = self.default_user_checkpoints.get(CheckpointType.CODE_EXECUTION)
            if not checkpoint:
                LOGGER.error("No default checkpoint defined for code execution")
                return False
            return self._create_checkpoint_interaction(checkpoint)
        return True

    async def _handle_tool_calls(self, api_manager: APIManager, tool_calls: List[Dict]) -> List[TaskResponse]:
        """Handle tool calls with permission checking."""
        # Execute tool calls
        messages: List[MessageDict] = await self.alice_agent.process_tool_calls(
            tool_calls,
            self._get_available_tool_map(api_manager),
            self._get_available_tool_functions(api_manager),
        )
        if not messages:
            return []
        
        return [msg.references.task_responses[0] for msg in messages if msg.references.task_responses]


    async def _handle_code_execution(self, messages: List[MessageDict]) -> List[CodeExecution]:
        """Handle code execution with permission checking."""
        # Execute code
        code_executions, exit_code = await self.alice_agent.process_code_execution(messages)
        return code_executions

    def _create_checkpoint_interaction(self, checkpoint: UserCheckpoint) -> UserInteraction:
        """Create a message containing a user checkpoint."""
        interaction = UserInteraction(
            user_checkpoint_id=checkpoint,
            owner=InteractionOwner(
                type=InteractionOwnerType.CHAT,
                id=self.id
            )
        )
        
        return interaction

    def _get_pending_interaction(self, message: MessageDict) -> Optional[UserInteraction]:
        """Get a pending user interaction from a message if it exists."""
        if not message.references or not message.references.user_interactions:
            return None
            
        for interaction in message.references.user_interactions:
            if not interaction.user_response:
                return interaction
                
        return None

    def _find_message_with_interaction(self, interaction: UserInteraction) -> Optional[MessageDict]:
        """Find the message containing a specific interaction."""
        for message in self.messages:
            if (message.references and 
                message.references.user_interactions and 
                any(ui.owner.id == interaction.owner.id for ui in message.references.user_interactions)):
                return message
        return None

    def _should_continue_turns(self, turn_message: MessageDict) -> bool:
        """Determine if we should continue with another turn."""
        # Continue if we had tool calls or code execution
        return turn_message.references.tool_calls or turn_message.references.code_executions

    def _create_error_message(self, error_msg: str) -> MessageDict:
        """Create a standardized error message."""
        return MessageDict(
            role=RoleTypes.ASSISTANT,
            content=f"An error occurred: {error_msg}",
            generated_by="system",
            type=ContentType.TEXT,
            assistant_name=self.alice_agent.name
        )

    async def _generate_llm_response(self, api_manager: APIManager, messages: List[MessageDict], tools_list: List[ToolFunction], **kwargs) -> MessageDict:
        """Generate LLM response with appropriate tools configuration."""
        return await self.alice_agent.generate_llm_response(
            api_manager, 
            messages, 
            tools_list, 
            **kwargs
        )
    
    def available_tools(self) -> Optional[List[AliceTask]]:
        """Get all available tools including retrieval tools if applicable."""
        tools = []
        tools.extend(self.agent_tools)
        tools.extend(self.retrieval_tools)
        return tools if tools else None

    def _get_available_tool_functions(self, api_manager: APIManager) -> Optional[List[ToolFunction]]:
        """Get all available tools including retrieval tools if applicable."""
        tools = self.available_tools()
        tool_functions = [tool.get_function(api_manager)["tool_function"] for tool in tools] if tools else None
        return tool_functions if tool_functions else None
    
    def _get_available_tool_map(self, api_manager: APIManager) -> Optional[Dict[str, Callable]]:
        """Get a map of all available tools."""
        tools = self.available_tools()
        if tools:
            tool_map = {}
            for tool in tools:
                tool_map.update(tool.get_function(api_manager)["function_map"])
            return tool_map if tool_map else None
        return None
    
    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        """Validate all required APIs for the chat and its tools."""
        result = {
            "chat_name": self.name,
            "status": "valid",
            "warnings": [],
            "llm_api": "valid",
            "agent_tools": [],
            "retrieval_tools": []
        }
        
        # Validate LLM API
        try:
            if not api_manager.get_api_by_type("llm_api", self.alice_agent.llm_model.api_name):
                result["status"] = "warning"
                result["llm_api"] = "not_found"
                result["warnings"].append("Required LLM API is not active or not found.")
        except ValueError as e:
            result["status"] = "warning"
            result["llm_api"] = "invalid"
            result["warnings"].append(str(e))
        
        # Validate tools
        for func in self.agent_tools:
            func_result = func.deep_validate_required_apis(api_manager)
            result["agent_tools"].append(func_result)
            if func_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].extend(func_result["warnings"])

        for func in self.retrieval_tools:
            func_result = func.deep_validate_required_apis(api_manager)
            result["retrieval_tools"].append(func_result)
            if func_result["status"] == "warning":
                result["status"] = "warning"
                result["warnings"].extend(func_result["warnings"])
        
        return result