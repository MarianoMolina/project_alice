from typing import List, Any, Dict
from workflow.util.const import CHAR_PER_TOKEN, EST_TOKENS_PER_TOOL
from workflow.util.message_prune.message_prune_utils import calculate_message_size, MessageApiFormat

def est_token_count(text: str) -> int:
    """Estimate token count for a given string."""
    return len(text) // CHAR_PER_TOKEN

def est_messages_token_count(messages: List[MessageApiFormat], tools: List[Any] = None) -> int:
    """Estimate token count for a list of messages and optional tools."""
    total_tokens = sum(calculate_message_size(msg) / CHAR_PER_TOKEN for msg in messages)
    if tools:
        total_tokens += EST_TOKENS_PER_TOOL * len(tools)
    return total_tokens