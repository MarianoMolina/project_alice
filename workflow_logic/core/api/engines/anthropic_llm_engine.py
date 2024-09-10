import traceback, json
from typing import Dict, Any, List, Optional
from anthropic import AsyncAnthropic
from anthropic.types import TextBlock, ToolUseBlock, ToolParam, Message
from anthropic.types.message_create_params import ToolChoiceToolChoiceAuto
from workflow_logic.core.parameters import ToolCall, ToolCallConfig, ToolFunction
from workflow_logic.core.api.engines.llm_engine import LLMEngine
from workflow_logic.core.data_structures import MessageDict, ContentType, LLMConfig
from workflow_logic.util import LOGGER

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
    def adapt_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Adapt the input messages to fit Anthropic's expected format.

        This method ensures that the message sequence alternates between 'user'
        and 'assistant' roles, and starts with a 'user' message. It also handles
        cases where messages have roles other than 'user' or 'assistant'.

        Args:
            messages (List[Dict[str, Any]]): The original list of messages.

        Returns:
            List[Dict[str, Any]]: The adapted list of messages suitable for Anthropic's API.
        """
        adapted = []
        for i, msg in enumerate(messages):
            role = msg.get("role", "")
            content = msg.get("content", "")

            if role not in ["user", "assistant"]:
                if i > 0 and i < len(messages) - 1:
                    prev_role = messages[i-1].get("role", "")
                    next_role = messages[i+1].get("role", "")
                    
                    if prev_role != next_role:
                        # Append content to the previous message
                        adapted[-1]["content"] += f"\n[{role}]: {content}"
                        continue
                    else:
                        # Use the other role
                        role = "user" if prev_role == "assistant" else "assistant"
                else:
                    # If it's the first or last message, default to user
                    role = "user"

            adapted.append({"role": role, "content": content})

        # Ensure alternating user-assistant pattern and start with user
        final_adapted = []
        expected_role = "user"
        for msg in adapted:
            if msg["role"] == expected_role:
                final_adapted.append(msg)
                expected_role = "assistant" if expected_role == "user" else "user"
            else:
                # Log warning about incorrect order
                LOGGER.warning(f"Message order issue: Expected {expected_role}, got {msg['role']}. Message content: {msg['content'][:50]}...")

        # Ensure it starts with a user message
        if final_adapted and final_adapted[0]["role"] != "user":
            LOGGER.warning("First message is not from user. Adjusting order.")
            final_adapted.insert(0, {"role": "user", "content": "Please continue."})

        return final_adapted
    
    async def generate_api_response(self, api_data: LLMConfig, messages: List[Dict[str, Any]], system: Optional[str] = None, tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, tool_choice: str = 'auto', n: Optional[int] = 1, **kwargs) -> MessageDict:
        """
        Generate a chat completion response using Anthropic's API.

        This method overrides the parent LLMEngine's method to work specifically
        with Anthropic's API. It adapts the input parameters, handles Anthropic-specific
        configurations, and processes the response to maintain consistency with
        other LLM engines' output format.

        Args:
            api_data (LLMConfig): Configuration for the Anthropic API client.
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

        anthropic_tools: Optional[List[ToolParam]] = self._convert_into_tool_params(tools) if tools else None

        adjusted_messages = self.adapt_messages(messages=messages)
        api_params = {
            "model": api_data.model,
            "messages": adjusted_messages,
            "max_tokens": max_tokens,
            "temperature": api_data.temperature,
            "system": system,
        }

        # Only add tools and tool_choice if tools are provided
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
                    tool_calls.append(ToolCall(
                        id = content.id,
                        type = "function",
                        function = ToolCallConfig(
                            name = content.name,
                            arguments = json.dumps(content.input)
                        )
                    ))

            cost = self.calculate_cost(response.usage.input_tokens, response.usage.output_tokens, response.model)

            return MessageDict(
                role="assistant",
                content=message_text,
                tool_calls=[tool_call for tool_call in tool_calls] if tool_calls else None,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": response.stop_reason,
                    "system_fingerprint": response.id,
                    "cost": cost
                }
            )
        
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