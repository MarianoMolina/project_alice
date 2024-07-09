import json, os, base64, logging, re, datetime
from typing import  Dict, List, Optional, Any, Union, Type, Tuple
from openai import OpenAI as OriginalOpenAI
from pydantic import BaseModel, Field
from enum import Enum
from workflow_logic.util.const import MODEL_FOLDER, HOST, LM_STUDIO_PORT

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class TestResult(BaseModel):
    test_name: str = Field(..., description="Name of the test")
    used_model: str = Field(..., description="Name/identifier of the model used")
    configuration: Dict[str, Any] = Field(..., description="Model configuration details")
    completion: str = Field(..., description="Generated completion by the model")
    tokens_generated: int = Field(..., description="Number of tokens generated")
    generation_time: float = Field(..., description="Total generation time in seconds")
    tokens_per_second: Optional[float] = Field(None, description="Generation speed in tokens per second")
    cost: float = Field(..., description="Cost for using 3rd party APIs")
    expected_output: str = Field(..., description="Expected output for manual comparison")
    parameters: Dict[str, Any] = Field(..., description="Additional parameters (e.g., context window, tokenization adjustments)")
    diagnostic_info: str = Field(..., description="Any additional diagnostic information")
    
    def __init__(self, **data):
        super().__init__(**data)
        self.tokens_per_second = self.tokens_generated / self.generation_time if self.generation_time > 0 else 0.0
        
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
    logging.error(f"Invalid JSON type: {json_type}")
    return None

def format_dict(d, indent=0):
    """ Recursively formats a dictionary into a structured string with indentation.
    
    Args:
        d (dict): The dictionary to format.
        indent (int): The current indentation level, used for recursive calls.

    Returns:
        str: A formatted string representation of the dictionary.
    """
    formatted_str = ""
    for key, value in d.items():
        if isinstance(value, dict):
            formatted_str += ' ' * indent + f"{key}: \n" + format_dict(value, indent + 4)
        elif isinstance(value, list):
            formatted_str += ' ' * indent + f"{key}: [\n"
            for item in value:
                if isinstance(item, dict):
                    formatted_str += format_dict(item, indent + 4) + ",\n"
                else:
                    formatted_str += ' ' * (indent + 4) + str(item) + ",\n"
            formatted_str += ' ' * indent + "]\n"
        else:
            formatted_str += ' ' * indent + f"{key}: {value}\n"
    return formatted_str

def get_json_from_json_block(json_block: str) -> Dict:
    """Extracts a JSON object from a string containing a JSON block.

    Args:
        json_block (str): A string containing a JSON block.

    Returns:
        Dict: The extracted JSON object.
    """
    json_block = json_block.strip()
    
    json_blocks = json_block.split('```json')
    if len(json_blocks) > 0:
        json_block = json_blocks[-1].split('```')[0].strip()
    else:
        json_block = ""
    return json.loads(json_block)

def model_path_from_file(model_file: str, model_folder: str = MODEL_FOLDER) -> str:
    # Normalize the model folder path
    normalized_model_folder = os.path.normpath(model_folder)
    return os.path.join(normalized_model_folder, model_file)

def model_name_from_file(model_file: str) -> str:
    path_parts = model_file.split('/')
    model_name = '/'.join(path_parts[:-1])
    return model_name

default_client = OriginalOpenAI(base_url=f"http://{HOST}:{LM_STUDIO_PORT}/v1", api_key="lm-studio")

def get_embedding(text: str, model_name: str, client: OriginalOpenAI = default_client):
   text = text.replace("\n", " ")
   return client.embeddings.create(input = [text], model = model_name).data[0].embedding

def describe_image(model_name: str, image_path: str, client: OriginalOpenAI = default_client, prompt: str = None, max_tokens = 1000, system_message: str = None) -> str:
    # Read the image and encode it to base64:
    try:
        image = open(image_path.replace("'", ""), "rb").read()
        base64_image = base64.b64encode(image).decode("utf-8")
    except:
        print("Couldn't read the image. Make sure the path is correct and the file exists.")
        exit()
    prompt = prompt or "What’s in this image?"
    system_message = system_message or "This is a chat between a user and an assistant. The assistant is helping the user to describe an image."
    completion = client.chat.completions.create(
        model = model_name,
        messages=[
        {
            "role": "system",
            "content": system_message,
        },
        {
            "role": "user",
            "content": [
            {"type": "text", "text": prompt},
            {
                "type": "image_url",
                "image_url": {
                "url": f"data:image/jpeg;base64,{base64_image}"
                },
            },
            ],
        }
        ],
        max_tokens=max_tokens,
        stream=True
    )
    response = ""
    for chunk in completion:
        if chunk.choices[0].delta.content:
            chunk_str = chunk.choices[0].delta.content
            response += chunk_str
            print(chunk_str, end="", flush=True)
    print("")
    del image, base64_image
    return response

def llama_model_params_to_dict(model_params):
    return {
        "n_gpu_layers": model_params.n_gpu_layers,
        "split_mode": model_params.split_mode,
        "main_gpu": model_params.main_gpu,
        "vocab_only": model_params.vocab_only,
        "use_mmap": model_params.use_mmap,
        "use_mlock": model_params.use_mlock,
        "check_tensors": model_params.check_tensors
    }
    
def save_results_to_file(results: List[Any], file_path: str):
    with open(file_path, "w") as file:
        # Check if any result has a .dict() method and convert it to a dict
        for i, result in enumerate(results):
            if hasattr(result, "dict"):
                results[i] = result.dict()
        json.dump(results, file, indent=2)

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
    return None

def turn_code_into_codeblock(code: str, lang: str) -> str:
    return f"```{lang}\n{code}\n```"

def sanitize_and_limit_prompt(prompt: str, limit: int = 50) -> str:
    # Sanitize the prompt
    sanitized_prompt = re.sub(r'[^a-zA-Z0-9\s_-]', '_', prompt)
    # Limit to the first n characters
    limited_sanitized_prompt = sanitized_prompt[:limit]
    return limited_sanitized_prompt

class UserRoles(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    name: str = Field(..., description="User's name")
    email: str = Field(..., description="User's email")
    password: Optional[str] = Field(None, description="User's password")
    role: UserRoles = Field('user', description="User's role")
    createdAt: Optional[datetime.datetime] = Field(None, description="User's creation date")
    updatedAt: Optional[datetime.datetime] = Field(None, description="User's last update date")
