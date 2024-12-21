import traceback
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from pydantic import Field
from typing import List, Optional, TypedDict
from workflow.core.api.engines.api_engine import APIEngine
from workflow.util import LOGGER, est_messages_token_count, ScoreConfig, est_token_count, MessagePruner, CHAR_PER_TOKEN, MessageApiFormat
from workflow.core.data_structures import (
    MessageDict, ContentType, ModelConfig, ApiType, References, FunctionParameters, ParameterDefinition, ToolCall, RoleTypes, MessageGenerators, ToolFunction
    )

class CostDict(TypedDict, total=False):
    input_cost: float
    output_cost: float
    total_cost: float
    
class UsageDict(TypedDict, total=False):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int

class MetadataDict(TypedDict, total=False):
    model: str
    usage: UsageDict
    cost: CostDict

class LLMEngine(APIEngine):
    """
    Language Model API engine implementing the OpenAI chat completions interface.
    
    This engine defines the standard interface for language model interactions,
    with a default implementation using the OpenAI SDK. It works with any
    OpenAI-compatible endpoint (OpenAI, Azure, LMStudio, etc.) and handles:
    - Message-based interactions
    - Tool/function calling
    - Token counting and context management
    - Cost calculation
    
    The engine implements automatic message pruning when context limits are
    approached and provides detailed usage metrics in the response metadata.
    
    Input Interface:
        - messages: List of conversation messages
        - system: Optional system prompt
        - tools: Optional list of available tools
        - max_tokens: Optional response length limit
        - temperature: Sampling temperature
        - tool_choice: Control over tool usage
        - n: Number of completions to generate
    
    Returns:
        References object containing MessageDict with:
        - Generated response
        - Tool calls (if any)
        - Usage statistics and cost calculation
        - Metadata about pruning and token estimation
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


    async def generate_api_response(self, 
                                    api_data: ModelConfig, 
                                    messages: List[MessageApiFormat], 
                                    system: Optional[str] = None, 
                                    tools: Optional[List[ToolFunction]] = None, 
                                    tool_choice: Optional[str] = 'auto', 
                                    n: Optional[int] = 1, 
                                    **kwargs
                                    ) -> References:
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
        
        if tools:
            tools = [tool.get_dict() for tool in tools]
        estimated_tokens = est_messages_token_count(messages, tools) + est_token_count(system)
        if not api_data.ctx_size:
            LOGGER.warning(f"Context size not set for model {api_data.model}. Using default value of 4096.")
            api_data.ctx_size = 4096

        if estimated_tokens > api_data.ctx_size:
            pruner = MessagePruner(
                max_total_size=api_data.ctx_size * CHAR_PER_TOKEN,
                score_config=ScoreConfig(),
                )
            LOGGER.warning(f"Estimated tokens ({estimated_tokens}) exceed context size ({api_data.ctx_size}) of model {api_data.model}. Pruning. ")
            messages = await pruner.prune(messages, self, api_data)
            estimated_tokens = est_messages_token_count(messages, tools) + est_token_count(system)
            LOGGER.debug(f"Pruned message len: {estimated_tokens}")
        elif estimated_tokens > 0.8 * api_data.ctx_size:
            LOGGER.warning(f"Estimated tokens ({estimated_tokens}) are over 80% of context size ({api_data.ctx_size}).")

        try:
            # Prepare the API call parameters
            api_params = {
                "model": api_data.model,
                "messages": messages,
                "max_tokens": api_data.max_tokens_gen,
                "temperature": api_data.temperature,
                "n": n, 
                "stream": False
            }

            # Only add tools and tool_choice if tools are provided
            if tools:
                api_params["tools"] = tools
                api_params["tool_choice"] = tool_choice

            response: ChatCompletion = await client.chat.completions.create(**api_params)

            # We'll use the first choice for the MessageDict
            choice = response.choices[0]
            content = choice.message.content

            if choice.message.tool_calls:
                LOGGER.debug(f"Tool calls: {choice.message.tool_calls}")
                LOGGER.debug(f'Model dump: {choice.message.tool_calls[0].model_dump()}')
                for tool_call in choice.message.tool_calls:
                    LOGGER.debug(f'Tool call: {ToolCall(**tool_call.model_dump())}')

            tool_calls = [ToolCall(**tool_call.model_dump()) for tool_call in choice.message.tool_calls] if choice.message.tool_calls else None
            function_call = choice.message.function_call.model_dump() if choice.message.function_call else None
            if function_call: # Deprecated by OAI -> checking in case any endpoint uses it
                try:
                    extra_tool_call = ToolCall.model_validate(function_call) if function_call else None
                    tool_calls.append(extra_tool_call)
                except Exception as e:
                    LOGGER.error(f"Error validating function call: {str(e)}\nFunction call: {function_call}")
                    LOGGER.error(traceback.format_exc())
            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=content,
                references=References(tool_calls=tool_calls),
                generated_by=MessageGenerators.LLM,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": response.model,
                    "usage": response.usage.model_dump(),
                    "finish_reason": choice.finish_reason,
                    "system_fingerprint": response.system_fingerprint,
                    "cost": self.calculate_cost(response.usage.prompt_tokens, response.usage.completion_tokens, api_data),
                    "estimated_tokens": estimated_tokens
                }
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in LLM API call: {str(e)}")
            LOGGER.error(traceback.format_exc())
            raise

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int, model_config: ModelConfig) -> CostDict:
        """
        Calculate the cost of the API call based on token usage and model.

        Args:
            prompt_tokens (int): Number of tokens in the prompt.
            completion_tokens (int): Number of tokens in the completion.
            model (str): The model used for the API call.

        Returns:
            float: The calculated cost of the API call.
        """
        input_cost_per_mill = model_config.model_costs.input_token_cost_per_million if not model_config.use_cache else model_config.model_costs.cached_input_token_cost_per_million
        input_cost = (prompt_tokens / 1000000) * input_cost_per_mill
        output_cost = (completion_tokens / 1000000) * model_config.model_costs.output_token_cost_per_million
        output = {
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": input_cost + output_cost
        }
        return output