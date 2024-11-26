from typing import List, Any, Dict
from workflow.util.const import CHAR_PER_TOKEN, EST_TOKENS_PER_TOOL

def est_token_count(text: str) -> int:
    """Estimate token count for a given string."""
    return len(text) // CHAR_PER_TOKEN

def est_messages_token_count(messages: List[Dict[str, Any]], tools: List[Any] = None) -> int:
    """Estimate token count for a list of messages and optional tools."""
    total_tokens = sum(est_token_count(msg.get('content', '')) for msg in messages)
    if tools:
        total_tokens += EST_TOKENS_PER_TOOL * len(tools)
    return total_tokens
