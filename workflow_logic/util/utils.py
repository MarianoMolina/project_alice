import json, os, base64, logging, re
from typing_extensions import TypedDict
from typing import  Dict, List, Optional, Literal, Any, Union, Type, Tuple
from openai import OpenAI as OriginalOpenAI
from jinja2 import Environment, FileSystemLoader, meta, Template
from typing_extensions import  Literal
from pydantic import BaseModel, Field
from workflow_logic.util.const import MODEL_FOLDER, PROMPT_PATH, HOST

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class ModelDefinition(TypedDict):
    short_name: str
    model_name: str
    model_format: str
    ctx_size: int
    model_type: str
    deployment: Literal["local", "remote"]
    model_file: Optional[str]  # Required for local models
    api_key: str
    port: Optional[int]  # Default: 1234
    api_type: Optional[str]  # Default: "openai"
    base_url: Optional[str]  # Default: "https://localhost:1234/v1"

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
      
class ModelConfig(TypedDict):
    model: str
    api_key: Optional[str]
    base_url: Optional[str]
    api_type: Optional[str]
    model_client_cls: Optional[str]

class LLMConfig(TypedDict):
    config_list: List[ModelConfig]
    temperature: Optional[float] = 0.9
    timeout: Optional[int] = 300

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

def autogen_default_llm_config(model_list: List[dict]) -> LLMConfig:
    if isinstance(model_list, dict):
        model_list = [model_list]
    return LLMConfig(temperature=0.3, config_list=model_list, timeout=120)

def model_path_from_file(model_file: str, model_folder: str = MODEL_FOLDER) -> str:
    # Normalize the model folder path
    normalized_model_folder = os.path.normpath(model_folder)
    return os.path.join(normalized_model_folder, model_file)

def model_name_from_file(model_file: str) -> str:
    path_parts = model_file.split('/')
    model_name = '/'.join(path_parts[:-1])
    return model_name

default_client = OriginalOpenAI(base_url=f"http://{HOST}:1234/v1", api_key="lm-studio")

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

def get_template_variables(template_name: str, template_path: Optional[str] = None) -> List[str]:
    """
    Extracts the variables used in a Jinja2 template.
    :param template: The Jinja2 template object.
    :param template_path: Path to the directory containing the template.
    :param template_name: Name of the template file.
    :return: List of variable names used in the template.
    """
    if template_name is None:
        raise ValueError("template_name must be provided.")
    if isinstance(template_name, str) and not template_name.endswith(".prompt"):
        template_name += ".prompt"
    if template_path:
        env = Environment(loader=FileSystemLoader(template_path))
    else: 
        env = Environment(loader=FileSystemLoader(PROMPT_PATH))
    template_source = env.loader.get_source(env, template_name)
    parsed_content = env.parse(template_source)
    
    # Use meta.find_undeclared_variables to find all undeclared variables in the template
    variables = meta.find_undeclared_variables(parsed_content)
    
    # Return the variables as a sorted list
    return sorted(variables)

def get_jinjia_template(template_name: str, template_path: str = None) -> Template:
    if template_path:
        env = Environment(loader=FileSystemLoader(template_path))
    else: 
        env = Environment(loader=FileSystemLoader(PROMPT_PATH))
    return env.get_template(template_name)

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
