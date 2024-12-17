import traceback, json
from pydantic import Field
from typing import Dict, Any, List, Optional
from anthropic import AsyncAnthropic
from anthropic.types import TextBlock, ToolUseBlock, ToolParam, Message
from workflow.core.data_structures import ToolCall, ToolCallConfig, ToolFunction
from workflow.core.api.engines.llm_engines.llm_engine import LLMEngine
from workflow.core.data_structures import MessageDict, ContentType, ModelConfig, References, RoleTypes, MessageGenerators
from workflow.util import LOGGER, est_messages_token_count, est_token_count, CHAR_PER_TOKEN, MessagePruner, ScoreConfig, MessageApiFormat
from workflow.core.api.engines.llm_engines.anthropic_tool_util import ToolNameMapping

ANTHROPIC_PRICING_1k = {
    "claude-3-5-sonnet-20240620": (0.003, 0.015),
    "claude-3-sonnet-20240229": (0.003, 0.015),
    "claude-3-opus-20240229": (0.015, 0.075),
    "claude-3-haiku-20240307": (0.00025, 0.00125),
    "claude-2.1": (0.008, 0.024),
    "claude-2.0": (0.008, 0.024),
    "claude-instant-1.2": (0.008, 0.024),
}

class LLMAnthropic(LLMEngine):
    """
    LLMAnthropic engine for generating chat completions using Anthropic's API.

    This class inherits from LLMEngine and is specifically tailored to work with
    Anthropic's API. While it uses the same input structure as LLMEngine, it adapts
    the inputs to fit Anthropic's specific requirements, ultimately producing
    chat completions in a format consistent with other LLM engines.

    The class handles Anthropic-specific features such as message adaptation,
    tool parameter conversion, and cost calculation based on Anthropic's pricing.

    Attributes:
        Inherits all attributes from LLMEngine.

    Note:
        This class assumes the use of Anthropic's AsyncAnthropic client and
        follows Anthropic's API conventions for chat completions.
    """
    tool_mapping: ToolNameMapping = Field(default_factory=ToolNameMapping)
    
    def adapt_messages(self, messages: List[MessageApiFormat]) -> List[Dict[str, Any]]:
        """
        Adapt the input messages to fit Anthropic's expected format.

        This method ensures that the message sequence alternates between 'user'
        and 'assistant' roles, and starts with a 'user' message. It also handles
        cases where messages have roles other than 'user' or 'assistant'.

        Args:
            messages (List[MessageApiFormat]): The original list of messages.

        Returns:
            List[Dict[str, Any]]: The adapted list of messages suitable for Anthropic's API.
        """
        adapted = []
        for i, msg in enumerate(messages):
            role = msg.get("role", "")
            content = msg.get("content", "")

            if role not in [RoleTypes.USER, RoleTypes.ASSISTANT]:
                if i > 0 and i < len(messages) - 1:
                    prev_role = messages[i-1].get("role", "")
                    next_role = messages[i+1].get("role", "")
                    
                    if prev_role != next_role:
                        # Append content to the previous message
                        adapted[-1]["content"] += f"\n\n[{role}]: {content}"
                        continue
                    else:
                        # Use the other role
                        role = RoleTypes.USER if prev_role == RoleTypes.ASSISTANT else RoleTypes.ASSISTANT
                else:
                    # If it's the first or last message, default to user
                    role = RoleTypes.USER

            adapted.append({"role": role, "content": content})

        # Ensure alternating user-assistant pattern and start with user
        final_adapted = []
        expected_role = RoleTypes.USER
        for msg in adapted:
            if msg["role"] == expected_role:
                final_adapted.append(msg)
                expected_role = RoleTypes.ASSISTANT if expected_role == RoleTypes.USER else RoleTypes.USER
            else:
                LOGGER.warning(f"Message order issue: Expected {expected_role}, got {msg['role']}. Message content: {msg['content'][:50]}...")

        # Ensure it starts with a user message
        if final_adapted and final_adapted[0]["role"] != RoleTypes.USER:
            LOGGER.warning("First message is not from user. Adjusting order.")
            final_adapted.insert(0, {"role": RoleTypes.USER, "content": "Please continue."})

        if final_adapted and final_adapted[-1]["role"] == RoleTypes.ASSISTANT:
            LOGGER.warning("Last message is from assistant. Adjusting order.")
            final_adapted.append({"role": RoleTypes.USER, "content": "Please continue."})

        return final_adapted
    
    def _convert_into_tool_params(self, tools: List[ToolFunction]) -> List[ToolParam]:
        """Convert tool functions into Anthropic-compliant tool parameters."""
        converted_tools = []
        for tool in tools:
            if not isinstance(tool, ToolFunction):
                tool = ToolFunction(**tool)
            
            # Create a copy and update the name
            tool_copy = tool.model_copy()
            tool_copy.name = self.tool_mapping.register_tool(tool.name)
            converted_tools.append(tool_copy.convert_to_tool_params())
            
        return converted_tools
    
    def _process_tool_call(self, content: ToolUseBlock) -> ToolCall:
        """Process a tool call and restore original tool names."""
        original_name = self.tool_mapping.get_original_name(content.name) or content.name
        return ToolCall(
            id=content.id,
            type="function",
            function=ToolCallConfig(
                name=original_name,
                arguments=json.dumps(content.input)
            )
        )
        
    async def generate_api_response(self, api_data: ModelConfig, messages: List[MessageApiFormat], system: Optional[str] = None, 
                                    tools: Optional[List[ToolFunction]] = None, tool_choice: str = 'auto', n: Optional[int] = 1, **kwargs) -> References:
        """
        Generate a chat completion response using Anthropic's API.

        This method overrides the parent LLMEngine's method to work specifically
        with Anthropic's API. It adapts the input parameters, handles Anthropic-specific
        configurations, and processes the response to maintain consistency with
        other LLM engines' output format.

        Args:
            api_data (ModelConfig): Configuration for the Anthropic API client.
            messages (List[Dict[str, Any]]): List of conversation messages.
            system (Optional[str]): System message for the conversation.
            tools (Optional[List[Dict[str, Any]]]): List of available tools for the model.
            max_tokens (Optional[int]): Maximum number of tokens to generate.
            tool_choice (str): Whether to allow tool use (always 'auto' for Anthropic).
            n (Optional[int]): Number of chat completion choices to generate (not used in Anthropic API).
            **kwargs: Additional keyword arguments.

        Returns:
            MessageDict: A dictionary containing the generated message and metadata.

        Raises:
            ValueError: If Anthropic API key is missing from api_data.
            Exception: For any errors during the API call.
        """
        if not api_data.api_key:
            raise ValueError("Anthropic API key not found in API data")

        client = AsyncAnthropic(
            api_key=api_data.api_key, 
            base_url=api_data.base_url
        )

        # Handle token estimation and pruning
        estimated_tokens = est_messages_token_count(messages, tools) + est_token_count(system)
        if estimated_tokens > api_data.ctx_size:
            LOGGER.warning(f"Estimated tokens ({estimated_tokens}) exceed context size ({api_data.ctx_size}) of model {api_data.model}. Pruning.")
            pruner = MessagePruner(
                max_total_size=api_data.ctx_size * CHAR_PER_TOKEN,
                score_config=ScoreConfig(),
            )
            messages = await pruner.prune(messages, self, api_data)
            estimated_tokens = est_messages_token_count(messages, tools) + est_token_count(system)
            LOGGER.debug(f"Pruned message len: {estimated_tokens}")
        elif estimated_tokens > 0.8 * api_data.ctx_size:
            LOGGER.warning(f"Estimated tokens ({estimated_tokens}) are over 80% of context size ({api_data.ctx_size}).")

        # Prepare API parameters
        anthropic_tools: Optional[List[ToolParam]] = self._convert_into_tool_params(tools) if tools else None
        adjusted_messages = self.adapt_messages(messages=messages)
        
        api_params = {
            "model": api_data.model,
            "messages": adjusted_messages,
            "max_tokens": api_data.max_tokens_gen,
            "temperature": api_data.temperature,
            "system": system,
        }

        if anthropic_tools:
            api_params["tools"] = anthropic_tools
            api_params["tool_choice"] = {"type": "auto"}

        LOGGER.debug(f'API parameters: {api_params}')
        
        try:
            response: Message = await client.messages.create(**api_params)
            
            message_text = ""
            tool_calls: Optional[List[ToolCall]] = None
            
            for content in response.content:
                if isinstance(content, TextBlock):
                    message_text += content.text
                elif isinstance(content, ToolUseBlock):
                    if tool_calls is None:
                        tool_calls = []
                    tool_calls.append(self._process_tool_call(content))

            cost = self.calculate_cost(response.usage.input_tokens, response.usage.output_tokens, response.model)

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=message_text,
                references=References(tool_calls=tool_calls),
                generated_by=MessageGenerators.LLM,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": response.stop_reason,
                    "system_fingerprint": response.id,
                    "cost": cost,
                    "estimated_tokens": estimated_tokens
                }
            )
            return References(messages=[msg])
        
        except Exception as e:
            LOGGER.error(f"Error in Anthropic API call: {str(e)}")
            LOGGER.error(traceback.format_exc())
            raise
        
    def _convert_into_tool_params(self, tools: List[ToolFunction]) -> List[ToolParam]:
        """
        Convert the general tool functions into Anthropic-specific tool parameters.

        Args:
            tools (List[ToolFunction]): List of general tool functions.

        Returns:
            List[ToolParam]: List of Anthropic-specific tool parameters.
        """
        return [(tool if isinstance(tool, ToolFunction) else ToolFunction(**tool)).convert_to_tool_params() for tool in tools]

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate the cost of the API call based on Anthropic's pricing.

        This method uses Anthropic-specific pricing information to calculate
        the cost of the API call.

        Args:
            input_tokens (int): Number of tokens in the input.
            output_tokens (int): Number of tokens in the output.
            model (str): The Anthropic model used for the API call.

        Returns:
            float: The calculated cost of the API call.

        Note:
            If the model is not found in the pricing information, it returns 0.0
            and logs a warning.
        """
        if model in ANTHROPIC_PRICING_1k:
            input_cost_per_1k, output_cost_per_1k = ANTHROPIC_PRICING_1k[model]
            input_cost = (input_tokens / 1000) * input_cost_per_1k
            output_cost = (output_tokens / 1000) * output_cost_per_1k
            return input_cost + output_cost
        else:
            LOGGER.warning(f"Cost calculation not available for model {model}")
            return 0.0