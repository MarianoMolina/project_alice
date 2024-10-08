import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
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

        genai.configure(api_key=api_data.api_key)
        
        try:
            # Prepare the chat history (all messages except the last one)
            history = []
            for message in messages[:-1]:
                role = "model" if message["role"] == "assistant" else message["role"]
                history.append({"role": role, "parts": message["content"]})

            # Get the last message as the new input
            new_message = messages[-1]["content"] if messages else ""

            # Set up the model with system instruction if provided
            model_kwargs = {"model_name": api_data.model}
            if system:
                model_kwargs["system_instruction"] = system
            
            model = genai.GenerativeModel(**model_kwargs)

            # Start the chat with history
            chat = model.start_chat(history=history)

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

            # Send the new message to get the response
            response: GenerateContentResponse = chat.send_message(
                new_message,
                generation_config=generation_config,
                tools=tool_config
            )

            # Process tool calls
            tool_calls = []
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if part.function_call:
                        tool_calls.append(ToolCall(
                            type="function",
                            function={
                                "name": part.function_call.name,
                                "arguments": part.function_call.args
                            }
                        ))

            msg = MessageDict(
                role="assistant",
                content=response.text,
                tool_calls=tool_calls if tool_calls else None,
                generated_by="llm",
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.usage_metadata.candidates_token_count,
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