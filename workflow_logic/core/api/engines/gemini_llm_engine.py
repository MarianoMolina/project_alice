import google.generativeai as genai
from pydantic import Field
from typing import Dict, Any, List, Optional
from workflow_logic.core.api.engines import APIEngine
from workflow_logic.core.data_structures import MessageDict, ContentType, ModelConfig, ApiType, References, FunctionParameters, ParameterDefinition, ToolCall
from workflow_logic.util import LOGGER

class GeminiLLMEngine(APIEngine):
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
                ),
                "tool_choice": ParameterDefinition(
                    type="string",
                    description="Specifies the function calling mode.",
                    default="auto"
                )
            },
            required=["messages"]
        ),
        description="The inputs this API engine takes: requires a list of messages and optional function/tool related inputs."
    )
    required_api: ApiType = Field(ApiType.LLM_MODEL, title="The API engine required")

    async def generate_api_response(self, api_data: ModelConfig, messages: List[Dict[str, Any]], tools: Optional[List[Dict[str, Any]]] = None, max_tokens: Optional[int] = None, temperature: Optional[float] = 0.7, tool_choice: Optional[str] = "auto", **kwargs) -> References:
        if not api_data.api_key:
            raise ValueError("API key not found in API data")

        genai.configure(api_key=api_data.api_key)
        model = genai.GenerativeModel(api_data.model)

        try:
            content = []
            for message in messages:
                content.append(message['content'])

            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature
            )

            # Convert tools to Gemini's function declarations format
            function_declarations = []
            if tools:
                for tool in tools:
                    function_declarations.append({
                        "name": tool["function"]["name"],
                        "description": tool["function"]["description"],
                        "parameters": tool["function"]["parameters"]
                    })

            # Set up function calling configuration
            tool_config = None
            if function_declarations:
                tool_config = {
                    "function_declarations": function_declarations
                }
                if tool_choice:
                    tool_config["function_calling_config"] = {
                        "mode": tool_choice.upper()
                    }

            response = model.generate_content(
                content,
                generation_config=generation_config,
                tools=tool_config
            )

            tool_calls = None
            if response.candidates[0].content.parts[0].function_call:
                function_call = response.candidates[0].content.parts[0].function_call
                tool_calls = [ToolCall(
                    type="function",
                    function={
                        "name": function_call.name,
                        "arguments": function_call.args
                    }
                )]

            msg = MessageDict(
                role="assistant",
                content=response.text,
                tool_calls=tool_calls,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.candidates[0].token_count,
                    "total_tokens": response.usage_metadata.total_token_count,
                    "finish_reason": response.candidates[0].finish_reason.name
                }
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in Gemini API call: {str(e)}")
            raise

    @staticmethod
    def get_usage(message: MessageDict) -> Dict[str, Any]:
        creation_metadata = message.creation_metadata
        return {
            "prompt_tokens": creation_metadata.get('prompt_tokens', 0),
            "completion_tokens": creation_metadata.get('completion_tokens', 0),
            "total_tokens": creation_metadata.get('total_tokens', 0),
            "model": creation_metadata.get('model', ''),
        }