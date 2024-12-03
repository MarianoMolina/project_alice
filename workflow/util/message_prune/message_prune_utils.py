from enum import Enum
from typing import List, Dict, Any, Optional, TypedDict, Literal, Protocol, Tuple
from copy import deepcopy

class RoleTypes(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

class ToolCallConfig(TypedDict):
    arguments: Dict[str, Any]
    name: str

class ToolCallApiFormat(TypedDict):
    type: Literal["function"]
    function: ToolCallConfig

class MessageApiFormat(TypedDict):
    role: RoleTypes
    content: str
    tool_calls: List[Dict[str, Any]]

class LLMEngine(Protocol):
    """Protocol for LLM engines that can generate summaries"""
    async def generate_chat_completion(
        self, 
        api_data: Any,
        messages: List[MessageApiFormat],
        system: Optional[str]
    ) -> List[Any]:
        ...

class PruningStrategy(str, Enum):
    """Strategies for pruning messages"""
    RECENT_FIRST = "recent_first"
    ENDPOINTS = "endpoints"  # Keeps start and end of conversation
    HYBRID = "hybrid"  # Combination of the above

class ReplacementStrategy(str, Enum):
    """Strategies for replacing pruned content"""
    REMOVE = "remove"  # Complete removal with marker
    PARTIAL = "partial"  # Keep start with marker
    SUMMARIZE = "summarize"  # Use LLM to summarize

def calculate_message_size(message: MessageApiFormat, only_reducible: bool = False) -> int:
    """Calculate the total size of a message including content and tool calls"""
    if only_reducible:
        return calculate_tool_size(message, arguments_only=True) + calculate_content_size(message)
    return calculate_content_size(message) + calculate_tool_size(message)

def calculate_content_size(message: MessageApiFormat) -> int:
    """Calculate the size of a message content"""
    return len(message.get("content", ""))

def calculate_tool_size(message: MessageApiFormat, arguments_only: bool = False) -> int:
    """
    Calculate the size of message tool content.
    
    Args:
        message: The message containing tool calls
        arguments_only: If True, only count the size of function arguments.
                       If False, count the size of the entire tool call object.
    
    Returns:
        int: Total size of tool content in characters
    """
    tool_calls = message.get("tool_calls")
    if not tool_calls:
        return 0
    
    total_size = 0
    for tool_call in tool_calls:
        if arguments_only:
            # Only count the arguments string length
            function_data = tool_call.get("function", {})
            arguments = function_data.get("arguments", {})
            total_size += len(str(arguments))
        else:
            # Count the entire tool call object length
            total_size += len(str(tool_call))
            
    return total_size


class ContentStats(TypedDict):
    content_size: int
    tool_args_size: int
    tool_other_size: int
    total_size: int

def get_content_stats(message: Dict[str, Any]) -> ContentStats:
    """Calculate size statistics for different parts of a message"""
    total_tool = calculate_tool_size(message)
    only_args = calculate_tool_size(message, arguments_only=True)
    return {
        "content_size": calculate_content_size(message),
        "tool_args_size": only_args,
        "tool_other_size": total_tool - only_args,
        "total_size": calculate_message_size(message)
    }

def truncate_with_marker(text: str, max_chars: int, marker: str) -> str:
    """Truncate text to fit exactly within max_chars including marker"""
    composed_marker = f"... {marker}"
    len_composed = len(composed_marker)
    if max_chars <= len_composed:
        return composed_marker
   
    content_chars = max_chars - len_composed
    return f"{text[:content_chars]}{composed_marker}"

def truncate_tool_arguments(tool_call: Dict[str, Any], max_chars: int, marker: str) -> Dict[str, Any]:
    """Truncate tool call arguments while preserving structure"""
    new_tool_call = deepcopy(tool_call)
    if "function" in new_tool_call:
        args = str(new_tool_call["function"].get("arguments", ""))
        if args:
            new_tool_call["function"]["arguments"] = truncate_with_marker(args, max_chars, marker)
    return new_tool_call

def replace_content(
    message: MessageApiFormat,
    target_size: int,
    marker: str
) -> Tuple[MessageApiFormat, int]:
    """
    Replace message content to fit within target size while properly handling tool calls.
    """
    stats = get_content_stats(message)
    new_message = deepcopy(message)
    composed_marker = f"... {marker}"
    
    # If target is too small, return minimal message
    if target_size <= len(composed_marker):
        new_message["content"] = composed_marker
        if "tool_calls" in new_message:
            del new_message["tool_calls"]
        return new_message, len(composed_marker)

    # Handle tool calls if present
    if "tool_calls" in message and stats["tool_args_size"] > 0:
        available_space = target_size - stats["tool_other_size"]
        
        # Split available space proportionally
        total_reducible = stats["content_size"] + stats["tool_args_size"]
        content_space = int(available_space * (stats["content_size"] / total_reducible))
        tool_space = int(available_space * (stats["tool_args_size"] / total_reducible))
        
        # Update tool calls
        new_tool_calls = []
        args_per_call = tool_space // len(message["tool_calls"])
        for tool_call in message["tool_calls"]:
            new_tool_calls.append(truncate_tool_arguments(tool_call, args_per_call, marker))
        new_message["tool_calls"] = new_tool_calls
    else:
        content_space = target_size

    # Handle content
    new_message["content"] = truncate_with_marker(message["content"], content_space, marker)
    
    return new_message, calculate_message_size(new_message)