from typing import Dict, Any
from workflow_logic.core.communication import SearchResult, SearchOutput
from workflow_logic.core.parameters import ParameterDefinition
from workflow_logic.core.api.engines.llm_api_engine import LLMEngine
from workflow_logic.util.logging_config import LOGGER
from anthropic import AsyncAnthropic
from anthropic.types import TextBlock, ToolUseBlock
import json

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
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.input_variables.properties.update({
            "system": ParameterDefinition(
                type="string",
                description="System message to be used for the conversation.",
                default=None
            )
        })

    async def generate_api_response(self, api_data: Dict[str, Any], **kwargs) -> SearchOutput:
        if not api_data.get('api_key'):
            raise ValueError("Anthropic API key not found in API data")

        client = AsyncAnthropic(api_key=api_data['api_key'])
        
        messages = self._format_messages(kwargs.get('prompt'), kwargs.get('messages'))
        
        try:
            response = await client.messages.create(
                model=kwargs.get('model', 'claude-3-sonnet-20240229'),
                messages=messages,
                max_tokens=kwargs.get('max_tokens', 4096),
                temperature=kwargs.get('temperature', 0.7),
                system=kwargs.get('system'),
                tools=kwargs.get('tools')
            )
            
            message_text = ""
            tool_calls = None
            for content in response.content:
                if isinstance(content, TextBlock):
                    message_text += content.text
                elif isinstance(content, ToolUseBlock):
                    if tool_calls is None:
                        tool_calls = []
                    tool_calls.append({
                        "id": content.id,
                        "type": "function",
                        "function": {
                            "name": content.name,
                            "arguments": json.dumps(content.input)
                        }
                    })

            cost = self.calculate_cost(response.usage.input_tokens, response.usage.output_tokens, response.model)
            
            search_result = SearchResult(
                title="Anthropic LLM Response",
                url="",
                content=message_text,
                metadata={
                    "model": response.model,
                    "max_tokens": kwargs.get('max_tokens', 4096),
                    "temperature": kwargs.get('temperature', 0.7),
                    "usage": {
                        "prompt_tokens": response.usage.input_tokens,
                        "completion_tokens": response.usage.output_tokens,
                        "total_tokens": response.usage.input_tokens + response.usage.output_tokens
                    },
                    "tool_calls": tool_calls,
                    "cost": cost
                }
            )
            
            return SearchOutput(content=[search_result])
        
        except Exception as e:
            LOGGER.error(f"Error in Anthropic API call: {str(e)}")
            return SearchOutput(content=[])

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        if model in ANTHROPIC_PRICING_1k:
            input_cost_per_1k, output_cost_per_1k = ANTHROPIC_PRICING_1k[model]
            input_cost = (input_tokens / 1000) * input_cost_per_1k
            output_cost = (output_tokens / 1000) * output_cost_per_1k
            return input_cost + output_cost
        else:
            LOGGER.warning(f"Cost calculation not available for model {model}")
            return 0.0