from enum import Enum
from bson import ObjectId
from pydantic import Field, model_validator, BaseModel
from typing import List, Optional, Dict, Any
from workflow.util import LOGGER, get_traceback
from workflow.core.data_structures import (
    MessageDict, ToolFunction, ContentType, References, UserInteraction, FunctionConfig, 
    UserCheckpoint, Prompt, User, BaseDataStructure, DataCluster
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
    id: Optional[str] = Field(default=None, description="The unique ID of the chat conversation, must match the ID in the database", alias="_id")
    name: str = Field("New Chat", description="The name of the chat conversation")
    messages: Optional[List[MessageDict]] = Field([], description="List of messages in the chat conversation")
    alice_agent: AliceAgent = Field(
        default = AliceAgent(
            name="Alice",
            system_message=Prompt(
                name= "alice_default",
                content= "You are Alice, an AI personal assistant powered by a suite of tools. Your job is to assist your user to the best of your abilities."
            ),
        ), 
        description="The Alice agent object. Default is base Alice Agent.")
    agent_tools: Optional[List[AliceTask]] = Field(default_factory=list, description="List of tools to be registered with the agent")
    retrieval_tools: Optional[List[AliceTask]] = Field(default_factory=list, description="Optional retrieval task for accessing data cluster")
    user_checkpoints: Dict[str, UserCheckpoint] = Field(
        default_factory=dict,
        description="Node-specific user interaction checkpoints"
    )
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
        # Handle agent_tools initialization
        if self.agent_tools is None:
            self.agent_tools = []
        elif not isinstance(self.agent_tools, list):
            raise ValueError("agent_tools must be a list or None")
        
        # Convert agent_tools items to AliceTask instances
        processed_agent_tools = []
        for tool in self.agent_tools:
            if isinstance(tool, dict):
                try:
                    processed_agent_tools.append(AliceTask.model_validate(tool))
                except Exception as e:
                    raise ValueError(f"Failed to convert dictionary to AliceTask: {str(e)}")
            elif isinstance(tool, AliceTask):
                processed_agent_tools.append(tool)
            else:
                raise ValueError(f"Agent tools must be either dictionaries or AliceTask instances. Found: {type(tool)}")
        self.agent_tools = processed_agent_tools

        # Handle retrieval_tools initialization
        if self.retrieval_tools is not None:
            if not isinstance(self.retrieval_tools, list):
                raise ValueError("retrieval_tools must be a list or None")
            
            # Convert retrieval_tools items to AliceTask instances
            processed_retrieval_tools = []
            for tool in self.retrieval_tools:
                if isinstance(tool, dict):
                    try:
                        processed_retrieval_tools.append(AliceTask.model_validate(tool))
                    except Exception as e:
                        raise ValueError(f"Failed to convert dictionary to AliceTask: {str(e)}")
                elif isinstance(tool, AliceTask):
                    processed_retrieval_tools.append(tool)
                else:
                    raise ValueError(f"Retrieval tools must be either dictionaries or AliceTask instances. Found: {type(tool)}")
            self.retrieval_tools = processed_retrieval_tools

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
        # Get the base serialized data from parent class
        data = super().model_dump(*args, **kwargs)           

        # Handle lists of BaseModel instances
        if self.messages:
            data['messages'] = [msg.model_dump(*args, **kwargs) if isinstance(msg, BaseModel) else msg for msg in self.messages]
        
        if self.agent_tools:
            data['agent_tools'] = [tool.model_dump(*args, **kwargs) if isinstance(tool, BaseModel) else tool for tool in self.agent_tools]
            
        if self.retrieval_tools:
            data['retrieval_tools'] = [tool.model_dump(*args, **kwargs) if isinstance(tool, BaseModel) else tool for tool in self.retrieval_tools]

        # Handle individual BaseModel instances
        if self.alice_agent and isinstance(self.alice_agent, BaseModel):
            data['alice_agent'] = self.alice_agent.model_dump(*args, **kwargs)
            
        if self.data_cluster and isinstance(self.data_cluster, BaseModel):
            data['data_cluster'] = self.data_cluster.model_dump(*args, **kwargs)

        # Handle dictionary of BaseModel instances
        if self.user_checkpoints:
            data['user_checkpoints'] = {
                key: checkpoint.model_dump(*args, **kwargs) if isinstance(checkpoint, BaseModel) else checkpoint
                for key, checkpoint in self.user_checkpoints.items()
            }

        return data

    def _get_agent_tools(self, api_manager: APIManager) -> List[ToolFunction]:
        """Returns a list of all available agent_tools."""
        if self.agent_tools:
            return [tool.get_function(api_manager)["tool_function"] for tool in self.agent_tools]
        return []
    
    def _get_retrieval_tools(self, api_manager: APIManager) -> List[ToolFunction]:
        """Returns a list of all available retrieval_tools."""
        if self.retrieval_tools and self.data_cluster and bool(self.data_cluster):
            # Ensure retrieval task has current data cluster
            for tool in self.retrieval_tools:
                if (tool.data_cluster is None or 
                    tool.data_cluster != self.data_cluster):  # Now uses References.__eq__
                    LOGGER.debug("Updating retrieval task data cluster")
                    tool.data_cluster = self.data_cluster
            tools = [tool.get_function(api_manager)["tool_function"] for tool in self.retrieval_tools]
            return tools
        return []
    
    def get_available_tools(self, api_manager: APIManager) -> Optional[List[ToolFunction]]:
        """Returns a list of all available tools including the retrieval task if applicable."""
        tools = []
        tools.extend(self._get_agent_tools(api_manager))
        tools.extend(self._get_retrieval_tools(api_manager))

        return tools if tools else None
    
    def get_tool_list(self, api_manager: APIManager) -> List[FunctionConfig]:
        """Returns a list of function configurations for the available tasks."""
        if not self.agent_tools and not self.retrieval_tools:
            return []
        return [task.get_function(api_manager)["tool_function"].model_dump(exclude={'id', '_id'}) for task in self.get_available_tools().values()]

    async def generate_response(self, api_manager: APIManager, new_message: Optional[str] = None, user_data: Optional[User] = None) -> List[MessageDict]:
        """Main entry point for generating responses in the chat."""
        try:
            if not self.messages:
                self.messages = []
            if new_message:
                self.messages.append(MessageDict(
                    role="user",
                    content=new_message,
                    generated_by="user",
                    type=ContentType.TEXT
                ))

            # Check for pending user interaction in last message
            last_message = self.messages[-1] if self.messages else None
            if last_message and hasattr(last_message, 'references') and last_message.references:
                user_interaction = self._get_user_interaction(last_message)
                if user_interaction:
                    return await self._handle_pending_checkpoint(api_manager, user_interaction)

            # Start new chat turn sequence
            return await self._execute_chat_turns(api_manager, user_data)
        except Exception as e:
            error_msg = f"Error in chat generate_response: {str(e)}\nTraceback: {get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

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
                
                # Check for user checkpoint creation
                if any(self._has_pending_checkpoint(msg) for msg in turn_messages):
                    break
                
                # Check if we should continue with another turn
                if not self._should_continue_turns(turn_messages):
                    break
                
                turn_count += 1
                
            except Exception as e:
                error_msg = f"Error in turn {turn_count}: {str(e)}\nTraceback: {get_traceback()}"
                LOGGER.error(error_msg)
                all_generated_messages.append(self._create_error_message(error_msg))
                break

        return all_generated_messages

    async def _execute_single_turn(self, api_manager: APIManager, previous_messages: List[MessageDict], user_data: Optional[User] = None) -> List[MessageDict]:
        """Execute a single turn of the conversation (LLM -> tools -> code)."""
        turn_messages = []
        
        try:
            # Step 1: LLM Generation
            llm_message = await self._generate_llm_response(
                api_manager,
                self.messages + previous_messages,
                self.get_available_tools(api_manager),
                user_data=user_data
            )
            turn_messages.append(llm_message)

            # Step 2: Handle tool calls if present
            if llm_message.tool_calls and self.alice_agent.has_tools:
                tool_messages = await self._handle_tool_calls(
                    api_manager,
                    llm_message.tool_calls,
                    llm_message
                )
                if tool_messages:
                    turn_messages.extend(tool_messages)

            # Step 3: Handle code execution if present
            if self.alice_agent.has_code_exec:
                code_messages = await self._handle_code_execution(
                    api_manager,
                    [llm_message] + (tool_messages if 'tool_messages' in locals() else [])
                )
                if code_messages:
                    turn_messages.extend(code_messages)

            return turn_messages

        except Exception as e:
            error_msg = f"Error in turn execution: {str(e)}\nTraceback: {get_traceback()}"
            LOGGER.error(error_msg)
            return [self._create_error_message(error_msg)]

    async def _handle_tool_calls(self, api_manager: APIManager, tool_calls: List[Dict], parent_message: MessageDict) -> List[MessageDict]:
        """Handle tool calls with permission checking."""
        if self.alice_agent.has_tools == 0:  # DISABLED
            return []
            
        if self.alice_agent.has_tools == 2:  # WITH_PERMISSION
            # Check for existing interaction
            user_interaction = self._get_user_interaction(parent_message)
            if not user_interaction:
                # Create new checkpoint
                checkpoint = self.user_checkpoints[CheckpointType.TOOL_CALL]
                interaction = UserInteraction(
                    user_checkpoint_id=checkpoint,
                    task_response_id=self.id
                )
                return [self._create_checkpoint_message(checkpoint, interaction)]
            elif user_interaction.user_response and user_interaction.user_response.selected_option != 0:
                return []

        # Execute tool calls
        return await self.alice_agent.process_tool_calls(
            tool_calls,
            self.get_available_tools(api_manager),
            self.get_tool_list(api_manager)
        )

    async def _handle_code_execution(self, api_manager: APIManager, messages: List[MessageDict]) -> List[MessageDict]:
        """Handle code execution with permission checking."""
        if self.alice_agent.has_code_exec == 1:  # DISABLED
            return []

        # Check for code blocks
        code_blocks = self.alice_agent.collect_code_blocs(messages)
        if not code_blocks:
            return []

        if self.alice_agent.has_code_exec == 2:  # WITH_PERMISSION
            # Check for existing interaction
            last_message = messages[-1]
            user_interaction = self._get_user_interaction(last_message)
            if not user_interaction:
                # Create new checkpoint
                checkpoint = self.user_checkpoints[CheckpointType.CODE_EXECUTION]
                interaction = UserInteraction(
                    user_checkpoint_id=CheckpointType.CODE_EXECUTION,
                    task_response_id=str(ObjectId())
                )
                return [self._create_checkpoint_message(checkpoint, interaction)]
            elif user_interaction.user_response and user_interaction.user_response.selected_option != 0:
                return []

        # Execute code
        executed_messages, code_by_lang, exit_code = await self.alice_agent.process_code_execution(messages)
        return executed_messages

    async def _handle_pending_checkpoint(self, api_manager: APIManager, interaction: UserInteraction) -> List[MessageDict]:
        """Handle resuming execution from a checkpoint."""
        if interaction.user_checkpoint_id == CheckpointType.TOOL_CALL:
            # Resume from tool execution
            return await self._handle_tool_calls(
                api_manager,
                self.messages[-1].tool_calls,
                self.messages[-1]
            )
        elif interaction.user_checkpoint_id == CheckpointType.CODE_EXECUTION:
            # Resume from code execution
            return await self._handle_code_execution(api_manager, [self.messages[-1]])
        return []

    def _get_user_interaction(self, message: MessageDict) -> Optional[UserInteraction]:
        """Extract UserInteraction from message if present."""
        if not message.references:
            return None
        return next((ref for ref in message.references if isinstance(ref, UserInteraction)), None)

    def _has_pending_checkpoint(self, message: MessageDict) -> bool:
        """Check if message has a pending checkpoint."""
        interaction = self._get_user_interaction(message)
        return interaction is not None and interaction.user_response is None

    def _should_continue_turns(self, turn_messages: List[MessageDict]) -> bool:
        """Determine if we should continue with another turn."""
        # Continue if we had tool calls or code execution and haven't reached max turns
        return any(msg.role == "tool" for msg in turn_messages)

    def _create_checkpoint_message(self, checkpoint: UserCheckpoint, interaction: UserInteraction) -> MessageDict:
        """Create a message containing a user checkpoint."""
        return MessageDict(
            role="assistant",
            content=checkpoint.user_prompt,
            generated_by="system",
            type=ContentType.TEXT,
            references=References(user_interactions=[interaction])
        )

    def _create_error_message(self, error_msg: str) -> MessageDict:
        """Create a standardized error message."""
        return MessageDict(
            role="assistant",
            content=f"An error occurred: {error_msg}",
            generated_by="system",
            type=ContentType.TEXT,
            assistant_name=self.alice_agent.name
        )

    async def _generate_llm_response(self, api_manager: APIManager, messages: List[MessageDict], tools_list: List[ToolFunction], **kwargs) -> MessageDict:
        """Generate LLM response with appropriate tools configuration."""
        return await self.alice_agent.generate_llm_response(api_manager, messages, tools_list, **kwargs)
    
    def deep_validate_required_apis(self, api_manager: APIManager) -> Dict[str, Any]:
        result = {
            "chat_name": self.name,
            "status": "valid",
            "warnings": [],
            "llm_api": "valid",
            "functions": []
        }
        
        # Check LLM API
        try:
            data = api_manager.retrieve_api_data("llm_api", self.alice_agent.llm_model)
            if not data:
                result["status"] = "warning"
                result["llm_api"] = "not_found"
                result["warnings"].append(f"Required API llm_api is not active or not found.")
        except ValueError as e:
            result["status"] = "warning"
            result["llm_api"] = "invalid"
            result["warnings"].append(str(e))
        
        # Check functions
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