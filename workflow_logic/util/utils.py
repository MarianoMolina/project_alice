import json, os, base64, logging, re, datetime
from typing import  Dict, List, Optional, Any, Union, Type, Tuple
from openai import OpenAI as OriginalOpenAI
from pydantic import BaseModel, Field
from enum import Enum
from workflow_logic.util.const import MODEL_FOLDER, HOST, LM_STUDIO_PORT

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        
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

def model_path_from_file(model_file: str, model_folder: str = MODEL_FOLDER) -> str:
    # Normalize the model folder path
    normalized_model_folder = os.path.normpath(model_folder)
    return os.path.join(normalized_model_folder, model_file)

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
    id: Optional[str] = Field(None, description="User's ID", alias="_id")
    name: str = Field(..., description="User's name")
    email: str = Field(..., description="User's email")
    password: Optional[str] = Field(None, description="User's password")
    role: UserRoles = Field('user', description="User's role")
    createdAt: Optional[datetime.datetime] = Field(None, description="User's creation date")
    updatedAt: Optional[datetime.datetime] = Field(None, description="User's last update date")
