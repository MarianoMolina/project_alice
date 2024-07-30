from typing import Dict, Any
from pydantic import Field
from workflow_logic.core.api.engines import APIEngine
from workflow_logic.core.api import ApiType
from workflow_logic.util.api_utils import LLMConfig
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition
from workflow_logic.core.communication import MessageDict, MessageType
from workflow_logic.util.logging_config import LOGGER
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

class LLMEngine(APIEngine):
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "messages": ParameterDefinition(
                    type="array",
                    description="The list of messages in the conversation.",
                    default=None
                ),
                "functions": ParameterDefinition(
                    type="array",
                    description="A list of function definitions that the model may generate JSON inputs for.",
                    default=None
                ),
                "function_call": ParameterDefinition(
                    type="string",
                    description="Controls how the model responds to function calls.",
                    default=None
                ),
                "tools": ParameterDefinition(
                    type="array",
                    description="A list of tool definitions that the model may use.",
                    default=None
                ),
                "max_tokens": ParameterDefinition(
                    type="integer",
                    description="The maximum number of tokens to generate.",
                    default=None
                ),
                "temperature": ParameterDefinition(
                    type="number",
                    description="The sampling temperature to use.",
                    default=0.7
                ),
                "tool_choice": ParameterDefinition(
                    type="integer",
                    description="Wether to allow tool use or not.",
                    default='auto'
                ),
                "n": ParameterDefinition(
                    type="integer",
                    description="The number of chat completion choices to generate.",
                    default=1
                )
            },
            required=["messages"]
        ),
        description="The inputs this API engine takes: requires a list of messages and optional function/tool related inputs."
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: LLMConfig, **kwargs) -> MessageDict:
        """Generates the API response for the task, using the provided API data and messages."""
        if not api_data.api_key:
            raise ValueError("API key not found in API data")

        base_url = api_data.base_url
        if not base_url:
            raise ValueError("Base URL not found in API data")

        # Ensure the base_url doesn't end with a slash
        base_url = base_url.rstrip('/')

        # Create the client with the correct base_url
        client = AsyncOpenAI(
            api_key=api_data.api_key,
            base_url=base_url
        )

        try:
            response: ChatCompletion = await client.chat.completions.create(
                model=api_data.model,
                messages=kwargs['messages'],
                max_tokens=kwargs.get('max_tokens'),
                temperature=api_data.temperature,
                tools=kwargs.get('tools'),
                tool_choice=kwargs.get('tool_choice', 'auto') if kwargs.get('tools') else None,
                n=kwargs.get('n', 1), 
                stream=False
            )

            # We'll use the first choice for the MessageDict
            choice = response.choices[0]
            content = choice.message.content

            return MessageDict(
                role="assistant",
                content=content,
                tool_calls=[tool_call.model_dump() for tool_call in choice.message.tool_calls] if choice.message.tool_calls else None,
                function_call=choice.message.function_call.model_dump() if choice.message.function_call else None,
                generated_by="llm",
                type=MessageType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": choice.finish_reason,
                    "system_fingerprint": response.system_fingerprint,
                    "cost": self.calculate_cost(response.usage.prompt_tokens, response.usage.completion_tokens, response.model)
                }
            )

        except Exception as e:
            LOGGER.error(f"Error in LLM API call: {str(e)}")
            raise

    @staticmethod
    def get_usage(message: MessageDict) -> Dict[str, Any]:
        """Return usage summary of the response."""
        creation_metadata = message.get('creation_metadata', {})
        usage = creation_metadata.get('usage', {})
        return {
            "prompt_tokens": usage.get('prompt_tokens', 0),
            "completion_tokens": usage.get('completion_tokens', 0),
            "total_tokens": usage.get('total_tokens', 0),
            "cost": creation_metadata.get('cost', 0.0),
            "model": creation_metadata.get('model', ''),
        }

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int, model: str) -> float:
        # LLM pricing (as of last update, please check for the most recent pricing)
        pricing = {
            'gpt-3.5-turbo': (0.0015, 0.002),  # (input_price, output_price) per 1K tokens
            'gpt-4': (0.03, 0.06),
            'gpt-4-32k': (0.06, 0.12),
            # Add more models and their pricing as needed
        }

        model_pricing = pricing.get(model, (0.0, 0.0))
        input_cost = (prompt_tokens / 1000) * model_pricing[0]
        output_cost = (completion_tokens / 1000) * model_pricing[1]

        return input_cost + output_cost