import cohere
from cohere import NonStreamedChatResponse
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow_logic.core.api.engines import APIEngine
from workflow_logic.core.data_structures import MessageDict, ContentType, ModelConfig, ApiType, References, FunctionParameters, ParameterDefinition, ToolCall
from workflow_logic.util import LOGGER

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
                )
            },
            required=["messages"]
        ),
        description="The inputs this API engine takes: requires a list of messages and optional function/tool related inputs."
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, messages: List[Dict[str, Any]], tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, temperature: Optional[float] = 0.7, **kwargs) -> References:
        if not api_data.api_key:
            raise ValueError("API key not found in API data")

        client = cohere.Client(api_data.api_key)

        try:
            cohere_tools = []
            if tools:
                for tool in tools:
                    cohere_tools.append(cohere.ToolV2(type='function', function=tool))

            response: NonStreamedChatResponse = client.chat(
                model=api_data.model,
                messages=messages,
                tools=cohere_tools if cohere_tools else None,
                max_tokens=max_tokens,
                temperature=temperature
            )

            tool_calls = None
            if response.tool_calls:
                tool_calls = [ToolCall(
                    id=tool_call.id,
                    type="function",
                    function={
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                ) for tool_call in response.tool_calls]

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