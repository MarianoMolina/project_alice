from enum import Enum
from pydantic import Field, model_validator, BaseModel
from typing import List, Optional, Dict, Any
from workflow.util import LOGGER, get_traceback
from workflow.core.data_structures import (
    MessageDict, ContentType, References, ToolFunction,
    UserInteraction, UserCheckpoint, Prompt, User, 
    BaseDataStructure, DataCluster, InteractionOwner,
    InteractionOwnerType, MessageGenerators, RoleTypes,
    CodeExecution
)
from workflow.core.agent import AliceAgent
from workflow.core.api import APIManager
from workflow.core.tasks import AliceTask

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

    @model_validator(mode='after')
    def initialize_tools(self) -> 'AliceChat':
        """
        Ensures agent_tools and retrieval_tools are properly initialized as lists of AliceTask instances.
        
        This validator:
        1. Converts None to empty list for agent_tools
        2. Ensures retrieval_tools is either None or a list
        3. Casts dictionary items to AliceTask instances
        4. Validates that all items are or can be converted to AliceTask instances
        """
        if not isinstance(self.agent_tools, list):
            self.agent_tools = []
        if not isinstance(self.retrieval_tools, list):
            self.retrieval_tools = []
            
        # Convert dictionaries to AliceTask instances
        self.agent_tools = [
            AliceTask.model_validate(tool) if isinstance(tool, dict) else tool
            for tool in self.agent_tools
        ]
        self.retrieval_tools = [
            AliceTask.model_validate(tool) if isinstance(tool, dict) else tool
            for tool in self.retrieval_tools
        ]
        
        return self

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
        data = super().model_dump(*args, **kwargs)
        
        # Handle nested BaseModel instances
        if self.messages:
            data['messages'] = [
                msg.model_dump(*args, **kwargs) if isinstance(msg, BaseModel) else msg 
                for msg in self.messages
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

    async def generate_response(self, api_manager: APIManager, new_message: Optional[str] = None, user_data: Optional[User] = None) -> List[MessageDict]:
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
            return await self._execute_chat_turns(api_manager, user_data)
            
        except Exception as e:
            error_msg = f"Error in chat generate_response: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

    async def continue_user_interaction(self, api_manager: APIManager, interaction: UserInteraction) -> List[MessageDict]:
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
            if interaction.owner.type != InteractionOwnerType.CHAT or interaction.owner.id != self.id:
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
                return await self._handle_tool_calls(
                    api_manager,
                    target_message.references.tool_calls,
                    skip_permission=True
                )
            elif next_step == CheckpointType.CODE_EXECUTION:
                return await self._handle_code_execution(
                    [target_message],
                    skip_permission=True
                )

        except Exception as e:
            error_msg = f"Error processing interaction: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

        return []

    async def _execute_chat_turns(self, api_manager: APIManager, user_data: Optional[User] = None) -> List[MessageDict]:
        """Execute a sequence of chat turns until completion or max turns reached."""
        all_generated_messages = []
        turn_count = 0
        
        while turn_count < self.alice_agent.max_consecutive_auto_reply:
            try:
                turn_messages = await self._execute_single_turn(api_manager, all_generated_messages, user_data)
                
                if not turn_messages:
                    break
                    
                all_generated_messages.extend(turn_messages)
                
                # Check for pending interaction
                if any(self._get_pending_interaction(msg) for msg in turn_messages):
                    break
                    
                # Check if we should continue
                if not self._should_continue_turns(turn_messages):
                    break
                    
                turn_count += 1
                
            except Exception as e:
                error_msg = f"Error in turn {turn_count}: {str(e)}\n{get_traceback()}"
                LOGGER.error(error_msg)
                all_generated_messages.append(self._create_error_message(error_msg))
                break

        return all_generated_messages

    async def _execute_single_turn(self, api_manager: APIManager, previous_messages: List[MessageDict], user_data: Optional[User] = None) -> List[MessageDict]:
        """Execute a single turn of the conversation (LLM -> tools -> code)."""
        turn_messages = []
        
        try:
            # Generate LLM response
            llm_message = await self._generate_llm_response(
                api_manager,
                self.messages + previous_messages,
                self._get_available_tools(api_manager),
                user_data=user_data
            )
            turn_messages.append(llm_message)

            # Handle tool calls
            if llm_message.references.tool_calls and self.alice_agent.has_tools:
                tool_messages = await self._handle_tool_calls(
                    api_manager,
                    llm_message.references.tool_calls,
                    llm_message
                )
                if tool_messages:
                    turn_messages.extend(tool_messages)

            # Handle code execution
            if self.alice_agent.has_code_exec:
                code_messages = await self._handle_code_execution([llm_message], False)
                if code_messages:
                    turn_messages.extend(code_messages)

            return turn_messages

        except Exception as e:
            error_msg = f"Error in turn execution: {str(e)}\n{get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

    async def _handle_tool_calls(self, api_manager: APIManager, tool_calls: List[Dict], skip_permission: bool = False) -> List[MessageDict]:
        """Handle tool calls with permission checking."""
        if self.alice_agent.has_tools == 0:  # DISABLED
            return []
            
        if not skip_permission and self.alice_agent.has_tools == 2:  # WITH_PERMISSION
            # Create new checkpoint
            checkpoint = self.default_user_checkpoints[CheckpointType.TOOL_CALL]
            return [self._create_checkpoint_message(checkpoint)]

        # Execute tool calls
        return await self.alice_agent.process_tool_calls(
            tool_calls,
            self._get_available_tools(api_manager),
            self._get_tool_list(api_manager)
        )

    async def _handle_code_execution(self, messages: List[MessageDict], skip_permission: bool = False) -> List[MessageDict]:
        """Handle code execution with permission checking."""
        if self.alice_agent.has_code_exec == 0:  # DISABLED
            return []

        # Check for code blocks
        code_blocks = self.alice_agent.collect_code_blocs(messages)
        if not code_blocks:
            return []

        if not skip_permission and self.alice_agent.has_code_exec == 2:  # WITH_PERMISSION
            # Create new checkpoint
            checkpoint = self.default_user_checkpoints[CheckpointType.CODE_EXECUTION]
            return [self._create_checkpoint_message(checkpoint)]

        # Execute code
        code_executions, exit_code = await self.alice_agent.process_code_execution(messages)
        return [MessageDict(
            role=RoleTypes.ASSISTANT,
            content=f"Code execution completed. Exit code: {exit_code}",
            generated_by=MessageGenerators.SYSTEM,
            type=ContentType.TEXT,
            references=References(code_executions=code_executions)
        )]

    def _create_checkpoint_message(self, checkpoint: UserCheckpoint) -> MessageDict:
        """Create a message containing a user checkpoint."""
        interaction = UserInteraction(
            user_checkpoint_id=checkpoint,
            owner=InteractionOwner(
                type=InteractionOwnerType.CHAT,
                id=self.id
            )
        )
        
        return MessageDict(
            role=RoleTypes.ASSISTANT,
            content=checkpoint.user_prompt,
            generated_by="system",
            type=ContentType.TEXT,
            references=References(user_interactions=[interaction])
        )

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

    def _should_continue_turns(self, turn_messages: List[MessageDict]) -> bool:
        """Determine if we should continue with another turn."""
        # Continue if we had tool calls or code execution
        return any(msg.generated_by == MessageGenerators.TOOL for msg in turn_messages)

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

    def _get_available_tools(self, api_manager: APIManager) -> Optional[List[ToolFunction]]:
        """Get all available tools including retrieval tools if applicable."""
        tools = []
        tools.extend(self._get_agent_tools(api_manager))
        tools.extend(self._get_retrieval_tools(api_manager))
        return tools if tools else None

    def _get_agent_tools(self, api_manager: APIManager) -> List[ToolFunction]:
        """Get list of available agent tools."""
        if self.agent_tools:
            return [tool.get_function(api_manager)["tool_function"] 
                   for tool in self.agent_tools]
        return []
    
    def _get_retrieval_tools(self, api_manager: APIManager) -> List[ToolFunction]:
        """Get list of available retrieval tools."""
        if self.retrieval_tools and self.data_cluster:
            # Update data cluster if needed
            for tool in self.retrieval_tools:
                if tool.data_cluster != self.data_cluster:
                    tool.data_cluster = self.data_cluster
            
            return [tool.get_function(api_manager)["tool_function"] 
                   for tool in self.retrieval_tools]
        return []
    
    def _get_tool_list(self, api_manager: APIManager) -> List[Dict[str, Any]]:
        """Get list of all tool configurations."""
        tools = self._get_available_tools(api_manager)
        if not tools:
            return []
        return [tool.model_dump(exclude={'id', '_id'}) for tool in tools]

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