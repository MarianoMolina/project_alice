from workflow.core.data_structures import ApiType, ApiName
from .api_engine import APIEngine
from .search_engine import ArxivSearchAPI, ExaSearchAPI, GoogleSearchAPI, RedditSearchAPI, WikipediaSearchAPI
from .llm_engine import LLMEngine
from .anthropic_llm_engine import LLMAnthropic
from .image_gen_engine import ImageGenerationEngine
from .vision_model_engine import VisionModelEngine
from .anthropic_vision_engine import AnthropicVisionEngine
from .oai_stt_engine import OpenAISpeechToTextEngine
from .oai_timestamped_stt_engine import OpenAIAdvancedSpeechToTextEngine
from .text_to_speech_engine import OpenAITextToSpeechEngine
from .embedding_engine import OpenAIEmbeddingsEngine
from .gemini_llm_engine import GeminiLLMEngine
from .cohere_llm_engine import CohereLLMEngine
from .gemini_vision import GeminiVisionEngine
from .gemini_embedding import GeminiEmbeddingsEngine
from .gemini_stt import GeminiSpeechToTextEngine
from .gemini_img_gen import GeminiImageGenerationEngine
from .google_knowledge_graph_engine import GoogleGraphEngine
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
        ApiName.REDDIT_SEARCH: RedditSearchAPI,
    },
    ApiType.WIKIPEDIA_SEARCH: {
        ApiName.WIKIPEDIA_SEARCH: WikipediaSearchAPI,
    },
    ApiType.EXA_SEARCH: {
        ApiName.EXA_SEARCH: ExaSearchAPI,
    },
    ApiType.ARXIV_SEARCH: {
        ApiName.ARXIV_SEARCH: ArxivSearchAPI,
    },
    ApiType.GOOGLE_KNOWLEDGE_GRAPH: {
        ApiName.GOOGLE_KNOWLEDGE_GRAPH: GoogleGraphEngine,
    },
    ApiType.IMG_VISION: {
        ApiName.OPENAI_VISION: VisionModelEngine,
        ApiName.ANTHROPIC_VISION: AnthropicVisionEngine,
        ApiName.LM_STUDIO_VISION: VisionModelEngine,
        ApiName.LLAMA_VISION: VisionModelEngine,
        ApiName.MISTRAL_VISION: VisionModelEngine,
        ApiName.GEMINI_VISION: GeminiVisionEngine,
        ApiName.GROQ_VISION: VisionModelEngine
    },
    ApiType.IMG_GENERATION: {
        ApiName.OPENAI_IMG_GENERATION: ImageGenerationEngine,
        ApiName.GEMINI_IMG_GEN: GeminiImageGenerationEngine,
        ApiName.PIXART_IMG_GEN: PixArtImgGenEngine
    },
    ApiType.SPEECH_TO_TEXT: {
        ApiName.OPENAI_STT: OpenAISpeechToTextEngine,
        ApiName.OPENAI_ASTT: OpenAIAdvancedSpeechToTextEngine,
        ApiName.GEMINI_STT: GeminiSpeechToTextEngine
    },
    ApiType.TEXT_TO_SPEECH: {
        ApiName.OPENAI_TTS: OpenAITextToSpeechEngine,
        ApiName.GROQ_TTS: OpenAITextToSpeechEngine,
        ApiName.BARK_TTS: BarkEngine
    },
    ApiType.EMBEDDINGS: {
        ApiName.OPENAI_EMBEDDINGS: OpenAIEmbeddingsEngine,
        ApiName.MISTRAL_EMBEDDINGS: OpenAIEmbeddingsEngine,
        ApiName.GEMINI_EMBEDDINGS: GeminiEmbeddingsEngine,
        ApiName.LM_STUDIO_EMBEDDINGS: OpenAIEmbeddingsEngine
    },
}
__all__ = ["ArxivSearchAPI", "ExaSearchAPI", "GoogleSearchAPI", "RedditSearchAPI", "WikipediaSearchAPI", "APIEngine", "GeminiImageGenerationEngine",
           "LLMEngine", "LLMOpenAI", "LLMAnthropic", "ImageGenerationEngine", "CohereLLMEngine", "GeminiVisionEngine", "GeminiEmbeddingsEngine", "GeminiSpeechToTextEngine",
           "VisionModelEngine", "AnthropicVisionEngine", "OpenAISpeechToTextEngine", "OpenAIAdvancedSpeechToTextEngine", "BarkEngine"
           "OpenAITextToSpeechEngine", "OpenAIEmbeddingsEngine", "GeminiLLMEngine", "CohereLLMEngine", "GoogleGraphEngine"]