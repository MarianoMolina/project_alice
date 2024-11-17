import { ColorLens, Download, Edit, EditNote, Google, RecordVoiceOver, Reddit, Search, Tag, Visibility } from "@mui/icons-material";
import { ApiType, ApiName } from "../types/ApiTypes";
import { AIIcon, AnthropicIcon, ArxivIcon, AzureIcon, BarkIcon, CohereIcon, GeminiIcon, GroqIcon, LlamaIcon, LMStudioIcon, 
  MistralIcon, OpenAiIcon, WikipediaIcon, WolframAlphaIcon } from "./CustomIcons";

// Base interfaces for API configurations
interface BaseApiConfig {
  api_key: string;
  base_url: string;
}

interface GoogleSearchConfig {
  api_key: string;
  cse_id: string;
}

interface LocalApiConfig {
  base_url: string;
}

interface RedditConfig {
  client_id: string;
  client_secret: string;
}

interface WolframConfig {
  app_id: string;
}

interface ExaConfig {
  api_key: string;
}

// Type for empty config (equivalent to Python's dict)
type EmptyConfig = Record<string, never>;

// Map API names to their configuration types
export type ApiConfigType = {
  [ApiName.OPENAI]: BaseApiConfig;
  [ApiName.ANTHROPIC]: BaseApiConfig;
  [ApiName.GEMINI]: BaseApiConfig;
  [ApiName.MISTRAL]: BaseApiConfig;
  [ApiName.COHERE]: BaseApiConfig;
  [ApiName.LLAMA]: BaseApiConfig;
  [ApiName.LM_STUDIO]: LocalApiConfig;
  [ApiName.AZURE]: BaseApiConfig;
  [ApiName.GROQ]: BaseApiConfig;
  [ApiName.BARK]: LocalApiConfig;
  [ApiName.PIXART]: LocalApiConfig;
  [ApiName.GOOGLE_SEARCH]: GoogleSearchConfig;
  [ApiName.REDDIT]: RedditConfig;
  [ApiName.WIKIPEDIA]: EmptyConfig;
  [ApiName.EXA]: ExaConfig;
  [ApiName.ARXIV]: EmptyConfig;
  [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: ExaConfig;
  [ApiName.WOLFRAM_ALPHA]: WolframConfig;
  [ApiName.CUSTOM]: BaseApiConfig;
};
// API capabilities mapping
export const API_CAPABILITIES: Record<ApiName, Set<ApiType>> = {
  [ApiName.OPENAI]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.IMG_GENERATION,
    ApiType.SPEECH_TO_TEXT,
    ApiType.TEXT_TO_SPEECH,
    ApiType.EMBEDDINGS
  ]),
  [ApiName.ANTHROPIC]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION
  ]),
  [ApiName.GEMINI]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.IMG_GENERATION,
    ApiType.SPEECH_TO_TEXT,
    ApiType.EMBEDDINGS
  ]),
  [ApiName.MISTRAL]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.EMBEDDINGS
  ]),
  [ApiName.COHERE]: new Set([
    ApiType.LLM_MODEL
  ]),
  [ApiName.LLAMA]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION
  ]),
  [ApiName.LM_STUDIO]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.EMBEDDINGS
  ]),
  [ApiName.GROQ]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.TEXT_TO_SPEECH
  ]),
  [ApiName.AZURE]: new Set([
    ApiType.LLM_MODEL
  ]),
  [ApiName.BARK]: new Set([
    ApiType.TEXT_TO_SPEECH
  ]),
  [ApiName.PIXART]: new Set([
    ApiType.IMG_GENERATION
  ]),
  [ApiName.GOOGLE_SEARCH]: new Set([
    ApiType.GOOGLE_SEARCH
  ]),
  [ApiName.REDDIT]: new Set([
    ApiType.REDDIT_SEARCH
  ]),
  [ApiName.WIKIPEDIA]: new Set([
    ApiType.WIKIPEDIA_SEARCH
  ]),
  [ApiName.EXA]: new Set([
    ApiType.EXA_SEARCH
  ]),
  [ApiName.ARXIV]: new Set([
    ApiType.ARXIV_SEARCH
  ]),
  [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: new Set([
    ApiType.GOOGLE_KNOWLEDGE_GRAPH
  ]),
  [ApiName.WOLFRAM_ALPHA]: new Set([
    ApiType.WOLFRAM_ALPHA
  ]),
  [ApiName.CUSTOM]: new Set([
    ApiType.LLM_MODEL,
    ApiType.IMG_VISION,
    ApiType.IMG_GENERATION,
    ApiType.SPEECH_TO_TEXT,
    ApiType.TEXT_TO_SPEECH,
    ApiType.EMBEDDINGS
  ]),
};

export const API_BASE_URLS: Partial<Record<ApiName, string>> = {
  [ApiName.OPENAI]: 'https://api.openai.com/v1',
  [ApiName.AZURE]: 'https://YOUR_RESOURCE_NAME.openai.azure.com',
  [ApiName.ANTHROPIC]: 'https://api.anthropic.com',
  [ApiName.LM_STUDIO]: 'http://localhost:1234/v1',
  [ApiName.GEMINI]: 'https://api.gemini.ai',
  [ApiName.MISTRAL]: 'https://api.mistral.ai',
  [ApiName.LLAMA]: 'https://api.llama-api.com',
  [ApiName.COHERE]: 'https://api.cohere.ai',
  [ApiName.GROQ]: 'https://api.groq.com/openai/v1',
};

// Helper type to get config type for a specific API
export type GetApiConfig<T extends ApiName> = ApiConfigType[T];

export const apiNameIcons: Record<ApiName, React.ReactElement> = {
  [ApiName.REDDIT]: <Reddit />,
  [ApiName.GOOGLE_KNOWLEDGE_GRAPH]: <Google />,
  [ApiName.GOOGLE_SEARCH]: <Google />,
  [ApiName.GEMINI]: <GeminiIcon />,
  [ApiName.GROQ]: <GroqIcon />, 
  [ApiName.ANTHROPIC]: <AnthropicIcon />,
  [ApiName.WIKIPEDIA]: <WikipediaIcon />,
  [ApiName.ARXIV]: <ArxivIcon />,
  [ApiName.WOLFRAM_ALPHA]: <WolframAlphaIcon />,
  [ApiName.OPENAI]: <OpenAiIcon />,
  [ApiName.COHERE]: <CohereIcon />,
  [ApiName.LLAMA]: <LlamaIcon />, 
  [ApiName.AZURE]: <AzureIcon />,
  [ApiName.MISTRAL]: <MistralIcon />, 
  [ApiName.LM_STUDIO]: <LMStudioIcon />,
  [ApiName.BARK]: <BarkIcon />,
  [ApiName.PIXART]: <ColorLens />, 
  [ApiName.EXA]: <Search />,
  [ApiName.CUSTOM]: <Edit />,
};

export const apiTypeIcons: Record<ApiType, React.ReactElement> = {
  [ApiType.LLM_MODEL]: <AIIcon />,
  [ApiType.IMG_VISION]: <Visibility />,
  [ApiType.IMG_GENERATION]: <ColorLens />,
  [ApiType.SPEECH_TO_TEXT]: <EditNote />,
  [ApiType.TEXT_TO_SPEECH]: <RecordVoiceOver />,
  [ApiType.EMBEDDINGS]: <Tag />,
  [ApiType.GOOGLE_SEARCH]: <Google />,
  [ApiType.REDDIT_SEARCH]: <Reddit />,
  [ApiType.WIKIPEDIA_SEARCH]: <WikipediaIcon />,
  [ApiType.ARXIV_SEARCH]: <ArxivIcon />,
  [ApiType.EXA_SEARCH]: <Search />,
  [ApiType.GOOGLE_KNOWLEDGE_GRAPH]: <Google />,
  [ApiType.WOLFRAM_ALPHA]: <WolframAlphaIcon />,
  [ApiType.REQUESTS]: <Download />,
};