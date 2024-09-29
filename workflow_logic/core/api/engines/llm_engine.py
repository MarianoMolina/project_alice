import traceback
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow_logic.core.api.engines import APIEngine
from workflow_logic.core.parameters import FunctionParameters, ParameterDefinition, ToolCall
from workflow_logic.util import LOGGER
from workflow_logic.core.data_structures import MessageDict, ContentType, ModelConfig, ApiType, References

class LLMEngine(APIEngine):
    """
    LLMEngine for generating chat completions from OpenAI-compatible endpoints.

    This class can interact with any OpenAI-compatible endpoint, including Azure, OpenAI,
    and LMStudio. It's capable of generating chat completions from any of these services.

    Note: For LMStudio endpoints, the 'model' property uses the modelId instead of the
    model_name. This parsing is handled by the API's get_api_data method.

    Attributes:
        input_variables (FunctionParameters): Defines the expected input structure for the engine.
        required_api (ApiType): Specifies the required API type (LLM_MODEL).

    """
    input_variables: FunctionParameters = Field(
        default=FunctionParameters(
            type="object",
            properties={
                "messages": ParameterDefinition(
                    type="array",
                    description="The list of messages in the conversation.",
                    default=None
                ),
                "system": ParameterDefinition(
                    type="string",
                    description="System message to be used for the conversation.",
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

    async def generate_api_response(self, api_data: ModelConfig, messages: List[Dict[str, Any]], system: Optional[str] = None, tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, tool_choice: Optional[str] = 'auto', n: Optional[int] = 1, **kwargs) -> References:
        """
        Generates the API response for the task, using the provided API data and messages.

        This method can work with any OpenAI-compatible endpoint (OpenAI, Azure, LMStudio).
        It creates an AsyncOpenAI client with the provided configuration and generates
        a chat completion based on the input parameters.

        Args:
            api_data (ModelConfig): Configuration for the API client.
            messages (List[Dict[str, Any]]): List of conversation messages.
            system (Optional[str]): System message for the conversation.
            tools (Optional[List[Dict[str, Any]]]): List of available tools for the model.
            max_tokens (Optional[int]): Maximum number of tokens to generate.
            tool_choice (Optional[str]): Whether to allow tool use.
            n (Optional[int]): Number of chat completion choices to generate.
            **kwargs: Additional keyword arguments.

        Returns:
            References: A dictionary containing the generated message and metadata.

        Raises:
            ValueError: If API key or base URL is missing from api_data.
            Exception: For any errors during the API call.
        """
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
        if system:
            messages = [{"role": "system", "content": system}] + messages

        try:
            response: ChatCompletion = await client.chat.completions.create(
                model=api_data.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=api_data.temperature,
                tools=tools if tools else None,
                tool_choice=tool_choice if tools else None,
                n=n, 
                stream=False
            )

            # We'll use the first choice for the MessageDict
            choice = response.choices[0]
            content = choice.message.content

            if choice.message.tool_calls:
                LOGGER.info(f"Tool calls: {choice.message.tool_calls}")
                LOGGER.info(f'Model dump: {choice.message.tool_calls[0].model_dump()}')
                LOGGER.info(f'Tool call: {ToolCall(**choice.message.tool_calls[0].model_dump())}')


            msg = MessageDict(
                role="assistant",
                content=content,
                tool_calls=[ToolCall(**tool_call.model_dump()) for tool_call in choice.message.tool_calls] if choice.message.tool_calls else None,
                function_call=choice.message.function_call.model_dump() if choice.message.function_call else None,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": choice.finish_reason,
                    "system_fingerprint": response.system_fingerprint,
                    "cost": self.calculate_cost(response.usage.prompt_tokens, response.usage.completion_tokens, response.model)
                }
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in LLM API call: {str(e)}")
            LOGGER.error(traceback.format_exc())
            raise

    @staticmethod
    def get_usage(message: MessageDict) -> Dict[str, Any]:
        """
        Return usage summary of the response.

        Args:
            message (MessageDict): The message containing usage information.

        Returns:
            Dict[str, Any]: A dictionary summarizing token usage and cost.
        """
        creation_metadata = message.creation_metadata
        usage = creation_metadata.get('usage', {})
        return {
            "prompt_tokens": usage.get('prompt_tokens', 0),
            "completion_tokens": usage.get('completion_tokens', 0),
            "total_tokens": usage.get('total_tokens', 0),
            "cost": creation_metadata.get('cost', 0.0),
            "model": creation_metadata.get('model', ''),
        }

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int, model: str) -> float:
        """
        Calculate the cost of the API call based on token usage and model.

        Args:
            prompt_tokens (int): Number of tokens in the prompt.
            completion_tokens (int): Number of tokens in the completion.
            model (str): The model used for the API call.

        Returns:
            float: The calculated cost of the API call.
        """
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