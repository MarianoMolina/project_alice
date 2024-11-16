import json, re, numpy as np
from typing import List, Any, Type, Tuple, Dict
from workflow.util.logging_config import LOGGER

def check_cuda_availability() -> bool:
    try:
        import torch
    except ImportError:
        LOGGER.warning("PyTorch is not installed. Running in CPU mode.")
        return False
    if not torch.cuda.is_available():
        LOGGER.warning("CUDA is not available. Running in CPU mode.")
        return False
    try:
        test_tensor = torch.zeros(1).cuda()
        del test_tensor
        LOGGER.info("CUDA is available and working properly.")
        return True
    except Exception as e:
        LOGGER.warning(f"CUDA initialization failed: {str(e)}")
        return False
    
def json_to_python_type_mapping(json_type: str) -> Type | Tuple[Type, ...] | None:
    type_mapping = {
        "string": str,
        "integer": int,
        "number": (int, float),
        "boolean": bool,
        "array": list,
        "object": dict
    }
    if json_type in type_mapping:
        return type_mapping[json_type]
    LOGGER.error(f"Invalid JSON type: {json_type}")
    return None
   
def save_results_to_file(results: List[Any], file_path: str):
    with open(file_path, "w") as file:
        # Check if any result has a .dict() method and convert it to a dict
        for i, result in enumerate(results):
            if hasattr(result, "dict"):
                results[i] = result.dict()
        json.dump(results, file, indent=2)
    LOGGER.info(f"Results saved to {file_path}")


def sanitize_and_limit_string(prompt: str, limit: int = 50) -> str:
    # Sanitize the prompt
    sanitized_prompt = sanitize_string(prompt)
    # Limit to the first n characters
    limited_sanitized_prompt = sanitized_prompt[:limit]
    return limited_sanitized_prompt


def sanitize_string(s: str) -> str:
    # Remove special characters and convert to lowercase
    sanitized = re.sub(r'[^\w\s-]', '', s.lower())
    # Replace whitespace with underscores
    return '_'.join(sanitized.split())

def chunk_text(input_text: str, target_chunk_size: int) -> List[str]:
    """
    Splits the input text into chunks of approximately equal size, 
    trying to break at natural pause points.

    Args:
    input_text (str): The text to be chunked.
    target_chunk_size (int): The target size for each chunk.

    Returns:
    List[str]: A list of text chunks.
    """
    # Define break points (in order of preference)
    break_points = r'(?<=[.!?])\s+|(?<=[:;])\s+|\n|\r\n|\s{2,}'

    # If the text is shorter than the target chunk size, return it as is
    if len(input_text) <= target_chunk_size:
        return [input_text]

    chunks = []
    current_pos = 0
    text_length = len(input_text)

    while current_pos < text_length:
        # Calculate the end position for this chunk
        chunk_end = min(current_pos + target_chunk_size, text_length)

        # If we're not at the end of the text, look for a break point
        if chunk_end < text_length:
            # Search for break points within a window around the target chunk size
            window_start = max(current_pos, chunk_end - target_chunk_size // 2)
            window_end = min(text_length, chunk_end + target_chunk_size // 2)
            
            match = list(re.finditer(break_points, input_text[window_start:window_end]))
            
            if match:
                # Use the last match in the window as the break point
                chunk_end = window_start + match[-1].start()
            else:
                # If no break point is found, just use the calculated chunk end
                pass

        # Extract the chunk and add it to the list
        chunk = input_text[current_pos:chunk_end].strip()
        if chunk:
            chunks.append(chunk)

        # Move to the next chunk
        current_pos = chunk_end

    return chunks

def est_token_count(text: str) -> int:
    """Estimate token count for a given string."""
    return len(text) // 3  # Simple estimation

def est_messages_token_count(messages: List[Dict[str, Any]], tools: List[Any] = None) -> int:
    """Estimate token count for a list of messages and optional tools."""
    total_tokens = sum(est_token_count(msg.get('content', '')) for msg in messages)
    if tools:
        total_tokens += 100 * len(tools)  # Add 100 tokens per tool
    return total_tokens

def replace_message() -> str:
    """Return the replacement string for pruned messages."""
    return "[ctx_exceeded]"

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

def get_traceback() -> str:
    """
    Get the traceback information for the current exception.

    Returns:
        str: A string containing the formatted traceback.
    """
    import traceback
    return traceback.format_exc()


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    """
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    if np.linalg.norm(vec1) == 0 or np.linalg.norm(vec2) == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))
