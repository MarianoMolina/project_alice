import cohere
from cohere import NonStreamedChatResponse
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow.core.api.engines import APIEngine
from workflow.core.data_structures import MessageDict, ContentType, ModelConfig, ApiType, References, FunctionParameters, ParameterDefinition, ToolCall
from workflow.util import LOGGER, est_messages_token_count, prune_messages

class CohereLLMEngine(APIEngine):
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
                    description="Specifies the function calling mode.",
                    default="auto"
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

    async def generate_api_response(self, api_data: ModelConfig, messages: List[Dict[str, Any]], system: Optional[str] = None, tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, temperature: Optional[float] = 0.7, tool_choice: Optional[str] = "auto", n: Optional[int] = 1, **kwargs) -> References:
        if not api_data.api_key:
            raise ValueError("API key not found in API data")

        client = cohere.Client(api_data.api_key)

        try:
            # Prepare messages, including system message if provided
            cohere_messages = []
            if system:
                cohere_messages.append({"role": "SYSTEM", "message": system})
            for message in messages:
                role = message["role"].upper()
                cohere_messages.append({"role": role, "message": message["content"]})


            estimated_tokens = est_messages_token_count(cohere_messages, tools)
            if estimated_tokens > api_data.ctx_size:
                LOGGER.warning(f"Estimated tokens ({estimated_tokens}) exceed context size ({api_data.ctx_size}) of model {api_data.model}. Pruning. ")
            elif estimated_tokens > 0.8 * api_data.ctx_size:
                LOGGER.warning(f"Estimated tokens ({estimated_tokens}) are over 80% of context size ({api_data.ctx_size}).")
            # Prune messages if estimated tokens exceed context size
            if estimated_tokens > api_data.ctx_size:
                cohere_messages = prune_messages(cohere_messages, api_data.ctx_size)

            # Prepare tools
            cohere_tools = []
            if tools:
                for tool in tools:
                    cohere_tools.append(cohere.ToolV2(type='function', function=tool))

            response: NonStreamedChatResponse = client.chat(
                model=api_data.model,
                message=cohere_messages[-1]["message"],  # Last message as the current input
                chat_history=cohere_messages[:-1],  # All previous messages as history
                tools=cohere_tools if cohere_tools else None,
                max_tokens=max_tokens,
                temperature=temperature
            )

            tool_calls = None
            if response.tool_calls:
                tool_calls = [ToolCall(**tool_call.model_dump()) for tool_call in response.tool_calls]

            msg = MessageDict(
                role="assistant",
                content=response.text,
                tool_calls=tool_calls,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "token_count": response.meta.tokens,
                    "finish_reason": response.finish_reason,
                }
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in Cohere API call: {str(e)}")
            raise

    @staticmethod
    def get_usage(message: MessageDict) -> Dict[str, Any]:
        creation_metadata = message.creation_metadata
        return {
            "total_tokens": creation_metadata.get('token_count', 0),
            "model": creation_metadata.get('model', ''),
        }