import traceback, json
from typing import Dict, Any, List, Optional
from anthropic import AsyncAnthropic
from anthropic.types import TextBlock, ToolUseBlock, ToolParam, Message
from workflow_logic.core.parameters import ToolCall, ToolCallConfig, ToolFunction
from workflow_logic.core.api.engines.llm_api_engine import LLMEngine
from workflow_logic.util import LOGGER, MessageDict, MessageType, LLMConfig

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
    async def generate_api_response(self, api_data: LLMConfig, messages: List[Dict[str, Any]], system: Optional[str] = None, tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, tool_choice: Optional[str] = 'auto', n: Optional[int] = 1, **kwargs) -> MessageDict:
        if not api_data.api_key:
            raise ValueError("Anthropic API key not found in API data")

        client = AsyncAnthropic(
            api_key=api_data.api_key, 
            base_url=api_data.base_url
        )

        anthropic_tools: Optional[List[ToolParam]] = self._convert_into_tool_params(tools) if tools else None

        # Prepare the parameters for the API call
        api_params = {
            "model": api_data.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": api_data.temperature,
            "system": system,
        }

        # Only add tools and tool_choice if tools are provided
        if anthropic_tools:
            api_params["tools"] = anthropic_tools
            api_params["tool_choice"] = tool_choice

        print(f'API parameters: {api_params}')
        
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
                type=MessageType.TEXT,
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
        return [tool.convert_to_tool_params() for tool in tools]

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        if model in ANTHROPIC_PRICING_1k:
            input_cost_per_1k, output_cost_per_1k = ANTHROPIC_PRICING_1k[model]
            input_cost = (input_tokens / 1000) * input_cost_per_1k
            output_cost = (output_tokens / 1000) * output_cost_per_1k
            return input_cost + output_cost
        else:
            LOGGER.warning(f"Cost calculation not available for model {model}")
            return 0.0