import json, re, numpy as np
from typing import List, Any
from workflow.util.logger import LOGGER

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
