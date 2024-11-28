from typing import List, Any, Dict
from workflow.util.logger import LOGGER
from workflow.util.text_splitters.utils.token_utils import est_messages_token_count

def replace_message(msg: str = "[ctx_exceeded]") -> str:
    """Return the replacement string for pruned messages."""
    return msg

def pruning_message_count(messages: List[Dict[str, Any]]) -> int:
    """Count messages that haven't been pruned."""
    return sum(1 for msg in messages if msg.get('content') != replace_message())

def prune_messages(messages: List[Dict[str, Any]], ctx_size: int) -> List[Dict[str, Any]]:
    """Prune messages to fit within the context size."""
    pruned_messages = messages.copy()
    
    while est_messages_token_count(pruned_messages) > ctx_size:
        if pruning_message_count(pruned_messages) > 4:
            # Strategy 1: Remove content of second to last message
            for i in range(len(pruned_messages) - 2, 0, -1):
                if pruned_messages[i]['content'] != replace_message():
                    pruned_messages[i]['content'] = replace_message()
                    break
        else:
            # Strategy 2: Remove or trim the longest non-system message
            non_system_messages = [msg for msg in pruned_messages if msg['role'] != 'system']
            if not non_system_messages:
                break  # Can't prune any further
            
            longest_message = max(non_system_messages, key=lambda x: len(x.get('content', '')))
            longest_index = pruned_messages.index(longest_message)
            
            # Check if removing the longest message would be enough
            temp_messages = pruned_messages.copy()
            temp_messages[longest_index]['content'] = replace_message()
            if est_messages_token_count(temp_messages) > ctx_size:
                # Replace the longest message with [ctx_exceeded]
                pruned_messages = temp_messages
            else:
                # Trim the longest message
                excess_tokens = est_messages_token_count(pruned_messages) - ctx_size
                trim_chars = (excess_tokens * 4) + 3 + len(replace_message()) # Convert back to character estimate and add 3 more
                pruned_content = longest_message['content'][:-trim_chars] + "..." + replace_message()
                pruned_messages[longest_index]['content'] = pruned_content
    LOGGER.debug(f"Pruned messages: {pruned_messages}")
    return pruned_messages
