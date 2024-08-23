import json, re
from typing import List, Any, Union, Type, Tuple
from workflow_logic.util.logging_config import LOGGER

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