from workflow.core.data_structures import ApiType, ApiName
from .embedding_engines import EmbeddingEngine, GeminiEmbeddingsEngine
from .image_engines import ImageGenerationEngine, GeminiImageGenerationEngine, PixArtImgGenEngine
from .llm_engines import LLMEngine, LLMAnthropic, GeminiLLMEngine, CohereLLMEngine
from .search_engines import ArxivSearchAPI, ExaSearchAPI, RedditSearchAPI, GoogleSearchAPI, WikipediaSearchAPI, GoogleGraphEngine, WolframAlphaEngine
from .stt_engines import SpeechToTextEngine, GeminiSpeechToTextEngine
from .tts_engines import TextToSpeechEngine, BarkEngine
from .vision_engines import VisionModelEngine, AnthropicVisionEngine, GeminiVisionEngine
from .api_engine import APIEngine

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
        ApiName.GOOGLE_KNOWLEDGE_GRAPH: GoogleGraphEngine,
    },
    ApiType.WOLFRAM_ALPHA: {
        ApiName.WOLFRAM_ALPHA: WolframAlphaEngine,
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
        ApiName.OPENAI: SpeechToTextEngine,
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
           "VisionModelEngine", "AnthropicVisionEngine", "BarkEngine", "WolframAlphaEngine", "PixArtImgGenEngine", 'SpeechToTextEngine', 
           "TextToSpeechEngine", "EmbeddingEngine", "GeminiLLMEngine", "CohereLLMEngine", "GoogleGraphEngine"]