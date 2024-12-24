import os
from dotenv import load_dotenv

load_dotenv()

CHAR_TO_TOKEN = float(os.getenv("REACT_APP_CHAR_TO_TOKEN", "3.2"))
EST_TOKENS_PER_TOOL = 100

BACKEND_PORT = os.getenv("REACT_APP_BACKEND_PORT", 3000)
FRONTEND_PORT = os.getenv("FRONTEND_PORT", 4000)
WORKFLOW_PORT = os.getenv("REACT_APP_WORKFLOW_PORT", 8000)
FRONTEND_PORT_DOCKER = os.getenv("FRONTEND_PORT_DOCKER", 4000)
BACKEND_PORT_DOCKER = os.getenv("BACKEND_PORT_DOCKER", 3000)
HOST = os.getenv("REACT_APP_HOST", "localhost")
print(f"HOST: {HOST}")
DOCKER_HOST = "host.docker.internal"
FRONTEND_HOST = os.getenv("FRONTEND_HOST", "frontend")
BACKEND_HOST = os.getenv("REACT_APP_BACKEND_HOST", "backend")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN")
SHARED_UPLOAD_DIR = os.getenv("SHARED_UPLOAD_DIR", "/app/shared-uploads")
# Environment variable to control log level
LOG_LEVEL = os.getenv("REACT_APP_LOG_LEVEL", "INFO")

LOGGING_FOLDER = os.getenv("LOGGING_FOLDER", "logs")

LOCAL_LLM_API_URL = f"http://{BACKEND_HOST}:{BACKEND_PORT}/lm_studio/v1"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
EXA_API_KEY = os.getenv("EXA_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")
GOOGLE_KNOWLEDGE_GRAPH_API_KEY = os.getenv("GOOGLE_KNOWLEDGE_GRAPH_API_KEY")
WOLFRAM_ALPHA_APP_ID = os.getenv("WOLFRAM_ALPHA_APP_ID")
