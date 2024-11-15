from workflow.core.data_structures import ApiType, ApiName
from .api_engine import APIEngine
from .arxiv_search_engine import ArxivSearchAPI
from .exa_search_engine import ExaSearchAPI
from .reddit_search_engine import RedditSearchAPI
from .google_search_engine import GoogleSearchAPI
from .wikipedia_search_engine import WikipediaSearchAPI
from .llm_engine import LLMEngine
from .anthropic_llm_engine import LLMAnthropic
from .image_gen_engine import ImageGenerationEngine
from .vision_model_engine import VisionModelEngine
from .anthropic_vision_engine import AnthropicVisionEngine
from .oai_stt_engine import OpenAISpeechToTextEngine
from .oai_timestamped_stt_engine import OpenAIAdvancedSpeechToTextEngine
from .text_to_speech_engine import TextToSpeechEngine
from .embedding_engine import EmbeddingEngine
from .gemini_llm_engine import GeminiLLMEngine
from .cohere_llm_engine import CohereLLMEngine
from .gemini_vision import GeminiVisionEngine
from .gemini_embedding import GeminiEmbeddingsEngine
from .gemini_stt import GeminiSpeechToTextEngine
from .gemini_img_gen import GeminiImageGenerationEngine
from .google_knowledge_graph_engine import GoogleGraphEngine
from .wolfram_alpha_engine import WolframAlphaEngine
from .bark_engine import BarkEngine
from .pixart_img_gen_engine import PixArtImgGenEngine

ApiEngineMap = {
    ApiType.LLM_MODEL: {
        ApiName.OPENAI: LLMEngine,
        ApiName.LM_STUDIO: LLMEngine,
        ApiName.AZURE: LLMEngine,
        ApiName.MISTRAL: LLMEngine,
        ApiName.LLAMA: LLMEngine,
        ApiName.GROQ: LLMEngine,
        ApiName.ANTHROPIC: LLMAnthropic,
        ApiName.GEMINI: GeminiLLMEngine,
        ApiName.COHERE: CohereLLMEngine,
    },
    ApiType.GOOGLE_SEARCH: {
        ApiName.GOOGLE_SEARCH: GoogleSearchAPI,
    },
    ApiType.REDDIT_SEARCH: {
        ApiName.REDDIT: RedditSearchAPI,
    },
    ApiType.WIKIPEDIA_SEARCH: {
        ApiName.WIKIPEDIA: WikipediaSearchAPI,
    },
    ApiType.EXA_SEARCH: {
        ApiName.EXA: ExaSearchAPI,
    },
    ApiType.ARXIV_SEARCH: {
        ApiName.ARXIV: ArxivSearchAPI,
    },
    ApiType.GOOGLE_KNOWLEDGE_GRAPH: {
        ApiName.GOOGLE_KNOWLEDGE: GoogleGraphEngine,
    },
    ApiType.WOLFRAM_ALPHA: {
        ApiName.WOLFRAM: WolframAlphaEngine,
    },
    ApiType.IMG_VISION: {
        ApiName.OPENAI: VisionModelEngine,
        ApiName.ANTHROPIC: AnthropicVisionEngine,
        ApiName.LM_STUDIO: VisionModelEngine,
        ApiName.LLAMA: VisionModelEngine,
        ApiName.MISTRAL: VisionModelEngine,
        ApiName.GEMINI: GeminiVisionEngine,
        ApiName.GROQ: VisionModelEngine
    },
    ApiType.IMG_GENERATION: {
        ApiName.OPENAI: ImageGenerationEngine,
        ApiName.GEMINI: GeminiImageGenerationEngine,
        ApiName.PIXART: PixArtImgGenEngine
    },
    ApiType.SPEECH_TO_TEXT: {
        ApiName.OPENAI: OpenAISpeechToTextEngine,
        ApiName.OPENAI: OpenAIAdvancedSpeechToTextEngine,
        ApiName.GEMINI: GeminiSpeechToTextEngine
    },
    ApiType.TEXT_TO_SPEECH: {
        ApiName.OPENAI: TextToSpeechEngine,
        ApiName.GROQ: TextToSpeechEngine,
        ApiName.BARK: BarkEngine
    },
    ApiType.EMBEDDINGS: {
        ApiName.OPENAI: EmbeddingEngine,
        ApiName.MISTRAL: EmbeddingEngine,
        ApiName.GEMINI: GeminiEmbeddingsEngine,
        ApiName.LM_STUDIO: EmbeddingEngine
    },
}

__all__ = ["ArxivSearchAPI", "ExaSearchAPI", "GoogleSearchAPI", "RedditSearchAPI", "WikipediaSearchAPI", "APIEngine", "GeminiImageGenerationEngine",
           "LLMEngine", "LLMOpenAI", "LLMAnthropic", "ImageGenerationEngine", "CohereLLMEngine", "GeminiVisionEngine", "GeminiEmbeddingsEngine", "GeminiSpeechToTextEngine",
           "VisionModelEngine", "AnthropicVisionEngine", "OpenAISpeechToTextEngine", "OpenAIAdvancedSpeechToTextEngine", "BarkEngine", "WolframAlphaEngine", "PixArtImgGenEngine",
           "TextToSpeechEngine", "EmbeddingEngine", "GeminiLLMEngine", "CohereLLMEngine", "GoogleGraphEngine"]