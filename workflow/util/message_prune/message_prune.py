from typing import List, Optional, Any, Tuple
from pydantic import BaseModel, Field
from workflow.util.message_prune.message_score import ScoreConfig, MessageStats, MessageScore
from workflow.util.logger import LOGGER
from workflow.util.message_prune.message_prune_utils import PruningStrategy, ReplacementStrategy, LLMEngine, calculate_message_size, MessageApiFormat, replace_content

class MessagePruner(BaseModel):
    max_total_size: int = Field(..., description="Maximum total size allowed")
    pruning_strategy: PruningStrategy = Field(
        default=PruningStrategy.HYBRID,
        description="Strategy for selecting messages to prune"
    )
    replacement_marker: str = Field(
        default="[ctx_exceeded]",
        description="Marker to use for pruned content"
    )
    
    # Scoring weights
    score_config: ScoreConfig = Field(
        default=ScoreConfig(),
        description="Configuration for message scoring behavior"
    )
    
    # Summarization settings
    enable_summarization: bool = Field(
        default=False,
        description="Whether to use LLM summarization"
    )
    summary_min_chars: int = Field(
        default=1000,
        description="Minimum characters for considering summarization"
    )
    max_summaries: int = Field(
        default=5,
        description="Maximum number of summaries to generate"
    )
    summarization_system_prompt: str = Field(
        default=(
            "You are a highly efficient assistant focused on summarizing conversation messages. "
            "Maintain key context while being as concise as possible. "
            "Include any crucial details, decisions, or outcomes. "
            "Mark the summary with [SUMMARY] at the start."
        ),
        description="System prompt for summarization"
    )

    def _score_messages(
        self, 
        messages: List[MessageApiFormat]
    ) -> List[Tuple[MessageApiFormat, MessageScore, MessageStats]]:
        """Score messages using MessageStats and return with MessageScore objects"""
        total_length = sum(calculate_message_size(m) for m in messages)
        
        scored_messages: List[Tuple[MessageApiFormat, MessageScore]] = []
        
        for idx, message in enumerate(messages):
            stats = MessageStats.from_message(
                message=message,
                index=idx,
                total_messages=len(messages),
                total_length=total_length
            )
            score = stats.calculate_score(self.score_config)
            scored_messages.append((message, score, stats))
            
        return scored_messages

    async def prune(
        self,
        messages: List[MessageApiFormat],
        llm_engine: Optional[LLMEngine] = None,
        api_data: Any = None
    ) -> List[MessageApiFormat]:
        """Prune messages to fit within size limit"""
        total_size = sum(calculate_message_size(m) for m in messages)
        if total_size <= self.max_total_size:
            return messages

        # Calculate initial reduction needed
        size_to_reduce = total_size - self.max_total_size

        # Score messages and sort by pruning priority 
        scored_messages = self._score_messages(messages)
        sorted_with_idx = sorted(
            [(msg, score, stats, idx) for idx, (msg, score, stats) in enumerate(scored_messages)],
            key=lambda x: x[1].final_score,
            reverse=True
        )

        # Initialize pruned messages and tracking variables
        pruned_messages = [msg.copy() for msg, _, _ in scored_messages]
        remaining_to_reduce = size_to_reduce
        processed_indices = set()

        while remaining_to_reduce > 0:
            # Find next most prunable message
            next_message = None
            for message, score, stats, original_idx in sorted_with_idx:
                if original_idx not in processed_indices:
                    next_message = (message, score, stats, original_idx)
                    break

            if next_message is None:
                LOGGER.warning(
                    f"Could not reduce messages to target size. "
                    f"Remaining overage: {remaining_to_reduce} characters"
                )
                break

            message, score, stats, original_idx = next_message
            processed_indices.add(original_idx)
            
            # Calculate target size for this message
            message_size = calculate_message_size(message)
            target_size = max(
                len(self.replacement_marker),
                message_size - remaining_to_reduce
            )
            
            # Replace content and track size reduction
            pruned_message, new_size = replace_content(
                message,
                target_size,
                self.replacement_marker
            )
            
            pruned_messages[original_idx] = pruned_message
            size_reduced = message_size - new_size
            remaining_to_reduce -= size_reduced
            
            LOGGER.info(f"Pruned message {original_idx}: {message_size} -> {new_size} chars "
                    f"({remaining_to_reduce} remaining to reduce)")

        final_size = sum(calculate_message_size(m) for m in pruned_messages)
        LOGGER.info(f"Final pruning result: {total_size} -> {final_size} chars "
                    f"(target: {self.max_total_size})")
        
        return pruned_messages