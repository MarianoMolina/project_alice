import cohere
from cohere import NonStreamedChatResponse
from typing import List, Optional
from workflow.core.api.engines.llm_engines.llm_engine import LLMEngine
from workflow.core.data_structures import (
    MessageDict,
    ContentType,
    ModelConfig,
    References,
    ToolCall,
    RoleTypes,
    MessageGenerators,
    ToolFunction,
)
from workflow.util import (
    LOGGER,
    est_messages_token_count,
    est_token_count,
    CHAR_TO_TOKEN,
    MessagePruner,
    ScoreConfig,
    MessageApiFormat,
)


class CohereLLMEngine(LLMEngine):
    async def generate_api_response(
        self,
        api_data: ModelConfig,
        messages: List[MessageApiFormat],
        system: Optional[str] = None,
        tools: Optional[List[ToolFunction]] = None,
        tool_choice: Optional[str] = "auto",
        n: Optional[int] = 1,
        **kwargs,
    ) -> References:
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

            estimated_tokens = est_messages_token_count(
                messages, tools
            ) + est_token_count(system)

            # Prune messages if estimated tokens exceed context size
            if estimated_tokens > api_data.ctx_size:
                LOGGER.warning(
                    f"Estimated tokens ({estimated_tokens}) exceed context size ({api_data.ctx_size}) of model {api_data.model}. Pruning. "
                )
                pruner = MessagePruner(
                    max_total_size=api_data.ctx_size * CHAR_TO_TOKEN,
                    score_config=ScoreConfig(),
                )
                messages = await pruner.prune(messages, self, api_data)
                estimated_tokens = est_messages_token_count(
                    messages, tools
                ) + est_token_count(system)
                LOGGER.debug(f"Pruned message len: {estimated_tokens}")
            elif estimated_tokens > 0.8 * api_data.ctx_size:
                LOGGER.warning(
                    f"Estimated tokens ({estimated_tokens}) are over 80% of context size ({api_data.ctx_size})."
                )

            # Prepare tools
            cohere_tools = []
            if tools:
                for tool in tools:
                    cohere_tools.append(
                        cohere.ToolV2(type="function", function=tool.get_dict())
                    )

            response: NonStreamedChatResponse = client.chat(
                model=api_data.model,
                message=cohere_messages[-1][
                    "message"
                ],  # Last message as the current input
                chat_history=cohere_messages[:-1],  # All previous messages as history
                tools=cohere_tools if cohere_tools else None,
                max_tokens=api_data.max_tokens_gen,
                temperature=api_data.temperature,
            )

            tool_calls = None
            if response.tool_calls:
                tool_calls = [
                    ToolCall(**tool_call.model_dump())
                    for tool_call in response.tool_calls
                ]

            msg = MessageDict(
                role=RoleTypes.ASSISTANT,
                content=response.text,
                references=References(tool_calls=tool_calls),
                generated_by=MessageGenerators.LLM,
                type=ContentType.TEXT,
                creation_metadata={
                    "model": api_data.model,
                    "usage": {
                        "prompt_tokens": response.meta.tokens.input_tokens,
                        "completion_tokens": response.meta.tokens.output_tokens,
                        "total_tokens": response.meta.tokens.output_tokens + response.meta.tokens.input_tokens,
                    },
                    "finish_reason": response.finish_reason,
                    "estimated_tokens": estimated_tokens,
                    "cost": self.calculate_cost(
                        response.meta.tokens.input_tokens,
                        response.meta.tokens.output_tokens,
                        api_data,
                    ),
                },
            )
            return References(messages=[msg])

        except Exception as e:
            LOGGER.error(f"Error in Cohere API call: {str(e)}")
            raise
