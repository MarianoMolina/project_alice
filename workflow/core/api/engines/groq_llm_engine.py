import traceback
from groq import Groq
from groq.types.chat import ChatCompletion
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow.core.api.engines import APIEngine
from workflow.util import LOGGER
from workflow.core.data_structures import MessageDict, ContentType, ModelConfig, ApiType, References, FunctionParameters, ParameterDefinition, ToolCall

# Cost per thousand tokens - Input / Output (NOTE: Convert $/Million to $/K)
GROQ_PRICING_1K = {
    "llama3-70b-8192": (0.00059, 0.00079),
    "mixtral-8x7b-32768": (0.00024, 0.00024),
    "llama3-8b-8192": (0.00005, 0.00008),
    "gemma-7b-it": (0.00007, 0.00007),
}
## Groq actually has an openai endpoint

class GroqLLMEngine(APIEngine):
    """
    GroqLLMEngine for generating chat completions using Groq's API.

    This class interacts with Groq's API to generate chat completions.

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
                    type="string",
                    description="Whether to allow tool use or not.",
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

        This method works with Groq's API. It creates a Groq client with the provided configuration
        and generates a chat completion based on the input parameters.

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
            ValueError: If API key is missing from api_data.
            Exception: For any errors during the API call.
        """
        if not api_data.api_key:
            raise ValueError("API key not found in API data")

        # Create the Groq client
        client = Groq(api_key=api_data.api_key)

        if system:
            messages = [{"role": "system", "content": system}] + messages

        try:
            # Prepare the API call parameters
            api_params = {
                "model": api_data.model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": api_data.temperature,
                "n": n,
                "stream": False
            }

            # Only add tools and tool_choice if tools are provided
            if tools:
                api_params["tools"] = tools
                api_params["tool_choice"] = tool_choice

            response: ChatCompletion = client.chat.completions.create(**api_params)

            # We'll use the first choice for the MessageDict
            choice = response.choices[0]
            content = choice.message.content

            if choice.message.tool_calls:
                LOGGER.debug(f"Tool calls: {choice.message.tool_calls}")
                for tool_call in choice.message.tool_calls:
                    LOGGER.debug(f'Tool call: {tool_call}')

            tool_calls = [ToolCall(id=tool_call.id, type="function", function=tool_call.function.dict()) for tool_call in choice.message.tool_calls] if choice.message.tool_calls else None
            msg = MessageDict(
                role="assistant",
                content=content,
                tool_calls=tool_calls,
                function_call=choice.message.function_call.dict() if choice.message.function_call else None,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.dict(),
                    "finish_reason": choice.finish_reason,
                    "cost": self.calculate_cost(response.usage.prompt_tokens, response.usage.completion_tokens, response.model)
                }
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in Groq LLM API call: {str(e)}")
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
        if model in GROQ_PRICING_1K:
            input_price, output_price = GROQ_PRICING_1K[model]
            input_cost = (prompt_tokens / 1000) * input_price
            output_cost = (completion_tokens / 1000) * output_price
            return input_cost + output_cost
        else:
            LOGGER.warning(f"Pricing not available for model {model}. Cost calculation skipped.")
            return 0.0