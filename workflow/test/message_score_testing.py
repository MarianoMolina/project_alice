import sys, random, string, asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any

current_dir = Path(__file__).parent.absolute()
parent_dir = current_dir.parent
if parent_dir not in sys.path:
    sys.path.insert(0, str(parent_dir))
from workflow.util import LOGGER
from workflow.util.message_prune.message_score import MessageStats, ScoreConfig
from workflow.util.message_prune.message_prune import MessagePruner
from workflow.util.message_prune.message_prune_utils import calculate_message_size

def generate_random_string(length: int) -> str:
    """Generate a random string of exactly 'length' characters"""
    return ''.join(random.choices(string.ascii_letters + ' ', k=length))

def create_message(
    role: str,
    content_length: int,
    tool_length: Optional[int] = None
) -> Dict[str, Any]:
    """Create a message with specific properties"""
    message = {
        "role": role,
        "content": generate_random_string(content_length)
    }
    
    if tool_length:
        message["tool_calls"] = [{
            "function": {
                "name": "test_function",
                "arguments": generate_random_string(tool_length)
            }
        }]
        
    return message

# Define some example messages with different characteristics
EXAMPLE_MESSAGES = [
    # Short messages
    ("SHORT_USER", create_message("user", 100)),
    ("SHORT_ASSISTANT", create_message("assistant", 100)),
    ("SHORT_SYSTEM", create_message("system", 100)),
    ("SHORT_TOOL", create_message("tool", 100)),
    
    # Medium messages
    ("MED_USER", create_message("user", 500)),
    ("MED_ASSISTANT", create_message("assistant", 500)),
    ("MED_SYSTEM", create_message("system", 500)),
    ("MED_TOOL", create_message("tool", 500)),
    
    # Long messages
    ("LONG_USER", create_message("user", 1000)),
    ("LONG_ASSISTANT", create_message("assistant", 1000)),
    ("LONG_SYSTEM", create_message("system", 1000)),
    ("LONG_TOOL", create_message("tool", 1000)),
    
    # Messages with tool calls
    ("TOOL_SMALL", create_message("assistant", 200, 100)),
    ("TOOL_MED", create_message("assistant", 200, 500)),
    ("TOOL_LARGE", create_message("assistant", 200, 1000)),
]

# Create different conversation patterns to test
TEST_CONVERSATIONS = [
    # Test 1: Increasing sizes
    [
        "SHORT_USER",
        "SHORT_ASSISTANT",
        "MED_USER",
        "MED_ASSISTANT",
        "LONG_USER",
    ],
    
    # Test 2: Tool calls progression
    [
        "SHORT_USER",
        "TOOL_SMALL",
        "MED_USER",
        "TOOL_MED",
        "LONG_USER",
        "TOOL_LARGE"
    ],
    
    # Test 3: System message test
    [
        "SHORT_SYSTEM",
        "SHORT_USER",
        "MED_ASSISTANT",
        "LONG_SYSTEM",
        "SHORT_USER"
    ],
    
    # Test 4: Mixed roles
    [
        "SHORT_USER",
        "MED_TOOL",
        "SHORT_ASSISTANT",
        "MED_SYSTEM",
        "LONG_TOOL"
    ],
    
    # Test 5: Long conversation
    [
        "SHORT_USER",
        "SHORT_ASSISTANT",
        "MED_USER",
        "TOOL_SMALL",
        "MED_ASSISTANT",
        "LONG_USER",
        "TOOL_LARGE",
        "SHORT_SYSTEM"
    ]
]

def build_conversation(pattern: List[str]) -> List[Dict[str, Any]]:
    """Build a conversation from a pattern of message names"""
    message_dict = dict(EXAMPLE_MESSAGES)
    return [message_dict[name].copy() for name in pattern]

def print_conversation_stats(conversation: List[Dict[str, Any]], config: ScoreConfig, only_header: bool = False):
    """Print statistics for a conversation"""
    total_length = sum(calculate_message_size(msg) for msg in conversation)
    
    LOGGER.info(f"Conversation Stats:")
    LOGGER.info(f"Total messages: {len(conversation)} - Total length: {total_length}")
    if only_header:
        return
    for idx, msg in enumerate(conversation):
        stats = MessageStats.from_message(
            message=msg,
            index=idx,
            total_messages=len(conversation),
            total_length=total_length
        )
        score = stats.calculate_score(config)
        LOGGER.info(f"Message {idx}:")
        LOGGER.info(f"Message stats: position={stats.position:.3f}, length={stats.length:.3f}, "
                    f"role={stats.role}, tool_length={stats.tool_length:.3f}")
        LOGGER.info(f"Message score: final_score={score.final_score:.3f}, base_score={score.base_score:.3f}, " 
                    f"role_multiplier={score.role_multiplier:.3f}, position_score={score.position_score:.3f}")

async def run_tests():
    """Run tests with different configurations"""
    # Default scoring config
    default_score_config = ScoreConfig()
    
    # Create pruner config with a reasonable max size
    pruner = MessagePruner(
        max_total_size=2000, 
        score_config=default_score_config,
        )
    
    for i, pattern in enumerate(TEST_CONVERSATIONS):
        LOGGER.info(f"\n=== Test Conversation {i+1} ===")
        conversation = build_conversation(pattern)
        
        # Print original conversation stats
        print_conversation_stats(conversation, default_score_config)
        
        # Prune conversation and show results
        pruned_conversation = await pruner.prune(conversation)
        
        # Print pruning details
        original_size = sum(calculate_message_size(msg) for msg in conversation)
        pruned_size = sum(calculate_message_size(msg) for msg in pruned_conversation)
        
        LOGGER.info(f"Pruning Results: Original size: {original_size} Pruned size: {pruned_size} (target: {pruner.max_total_size})")
        LOGGER.info(f"Reduction: {original_size - pruned_size} characters ({((original_size - pruned_size) / original_size) * 100:.1f}%)")

if __name__ == "__main__":
    asyncio.run(run_tests())