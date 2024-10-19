import json, re
from typing import List, Any, Union, Type, Tuple, Dict
from workflow.util.logging_config import LOGGER
from workflow.core.data_structures.task_response_new import NodeResponse, TaskResponse, ExecutionHistoryItem

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

def get_language_matching(language: str) -> Union[str, None]:
    language_map = {
        "python": "python",
        "py": "python",
        "javascript": "javascript",
        "js": "javascript",
        "typescript": "typescript",
        "ts": "typescript",
        "java": "java",
        "c": "c",
        "c++": "cpp",
        "cpp": "cpp",
        "csharp": "csharp",
        "cs": "csharp",
        "ruby": "ruby",
        "rb": "ruby",
        "go": "go",
        "golang": "go",
        "swift": "swift",
        "kotlin": "kotlin",
        "kt": "kotlin",
        "rust": "rust",
        "rs": "rust",
        "scala": "scala",
        "sc": "scala",
        "php": "php",
        "shell": "shell",
        "sh": "shell",
        "bash": "shell",
        "sql": "sql",
        "html": "html",
        "css": "css",
        "markdown": "markdown",
        "md": "markdown",
        "json": "json",
        "xml": "xml",
        "yaml": "yaml",
        "yml": "yaml",
    }
    if language in language_map:
        return language_map[language]
    LOGGER.warning(f"No matching language found for: {language}")
    return None

def sanitize_and_limit_prompt(prompt: str, limit: int = 50) -> str:
    # Sanitize the prompt
    sanitized_prompt = re.sub(r'[^a-zA-Z0-9\s_-]', '_', prompt)
    # Limit to the first n characters
    limited_sanitized_prompt = sanitized_prompt[:limit]
    LOGGER.debug(f"Sanitized and limited prompt: {limited_sanitized_prompt}")
    return limited_sanitized_prompt

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
    return len(text) // 4  # Simple estimation

def est_messages_token_count(messages: List[Dict[str, Any]], tools: List[Dict[str, Any]] = None) -> int:
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
    
    return pruned_messages

def complete_inner_execution_history(nodes: List[NodeResponse], base_order=0) -> List[NodeResponse]:
    flattened = []
    for node in sorted(nodes, key=lambda x: x.execution_order):
        new_node = NodeResponse(
            parent_task_id=node.parent_task_id,
            node_name=node.node_name,
            execution_order=base_order + len(flattened),
            exit_code=node.exit_code,
            references=node.references
        )
        flattened.append(new_node)
        if isinstance(node, TaskResponse):
            inner_nodes = complete_inner_execution_history(node.node_references, base_order + len(flattened))
            flattened.extend(inner_nodes)
    return flattened

def generate_node_responses_summary(node_responses: List[NodeResponse], verbose: bool = False) -> str:
    sorted_nodes = sorted(node_responses, key=lambda x: x.execution_order)
    
    if verbose:
        summaries = []
        for i, node in enumerate(sorted_nodes, 1):
            node_summary = f"Node {i} (Order: {node.execution_order}, Name: {node.node_name}, Exit: {node.exit_code}):"
            references_summary = node.references.summary() if node.references else "No references"
            node_summary += f"\n    {references_summary}"
            summaries.append(node_summary)
        return "\n\n".join(summaries)
    else:
        summaries = []
        for node in sorted_nodes:
            references_summary = node.references.summary() if node.references else "No refs"
            summaries.append(f"{node.node_name}({node.execution_order}):{references_summary}")
        return "\n\n".join(summaries)


def get_traceback() -> str:
    """
    Get the traceback information for the current exception.

    Returns:
        str: A string containing the formatted traceback.
    """
    import traceback
    return traceback.format_exc()

def simplify_execution_history(execution_history: List[NodeResponse]) -> List[ExecutionHistoryItem]:
    """
    Returns a simplified list of execution history items from a list of node responses.
    """
    return [ExecutionHistoryItem(
        parent_task_id=node.parent_task_id,
        node_name=node.node_name,
        execution_order=node.execution_order,
        exit_code=node.exit_code
    ) for node in execution_history]