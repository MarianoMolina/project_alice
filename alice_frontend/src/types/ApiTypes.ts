import { AliceModel, convertToAliceModel } from "./ModelTypes";
import { BaseDataseObject, convertToUser } from "./UserTypes";
import { FunctionParameters } from "./ParameterTypes";
import { HandleClickProps } from "./CollectionTypes";

export enum ApiType {
    LLM_MODEL = 'llm_api',
    GOOGLE_SEARCH = 'google_search',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
    IMG_VISION = 'img_vision',
    IMG_GENERATION = 'img_generation',
    SPEECH_TO_TEXT = 'speech_to_text',
    TEXT_TO_SPEECH = 'text_to_speech',
    EMBEDDINGS = 'embeddings',
}

export enum ApiName {
    OPENAI = 'openai_llm',
    OPENAI_VISION = 'openai_vision',
    OPENAI_IMG_GENERATION = 'openai_img_gen',
    OPENAI_EMBEDDINGS = 'openai_embeddings',
    OPENAI_TTS = 'openai_tts',
    OPENAI_STT = 'openai_stt',
    OPENAI_ASTT = 'openai_adv_stt',
    AZURE = 'azure',
    GEMINI = 'gemini_llm',
    GEMINI_VISION = 'gemini_vision',
    MISTRAL = 'mistral_llm',
    MISTRAL_VISION = 'mistral_vision',
    MISTRAL_EMBEDDINGS = 'mistral_embeddings',
    GEMINI_STT = 'gemini_stt',
    GEMINI_EMBEDDINGS = 'gemini_embeddings',
    COHERE = 'cohere_llm',
    GROQ = 'groq_llm',
    GROQ_VISION = 'groq_vision',
    GROQ_TTS = 'groq_tts',
    META = 'meta_llm',
    META_VISION = 'meta_vision',
    ANTHROPIC = 'anthropic_llm',
    ANTHROPIC_VISION = 'anthropic_vision',
    LM_STUDIO = 'lm-studio_llm',
    LM_STUDIO_VISION = 'lm-studio_vision',
    CUSTOM = 'Custom',
    GOOGLE_SEARCH = 'google_search',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
}

export enum LlmProvider {
    OPENAI = ApiName.OPENAI,
    AZURE = ApiName.AZURE,
    ANTHROPIC = ApiName.ANTHROPIC,
    LM_STUDIO = ApiName.LM_STUDIO,
}

export interface API extends BaseDataseObject{
    _id?: string;
    api_type: ApiType;
    api_name: ApiName;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: { [key: string]: string };
}

export interface LLMAPI extends BaseDataseObject {
    _id?: string;
    api_type: ApiType.LLM_MODEL;
    api_name: LlmProvider;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: { api_key: string, base_url: string };
}
export const convertToAPI = (data: any): API => {
    return {
        _id: data?._id || undefined,
        api_type: data?.api_type || ApiType.LLM_MODEL,
        api_name: data?.api_name || '',
        name: data?.name || '',
        is_active: data?.is_active || false,
        health_status: data?.health_status || 'unknown',
        default_model: (data?.default_model && Object.keys(data.default_model).length > 0) ? convertToAliceModel(data.default_model) : undefined,
        api_config: data?.api_config || {},
        created_by: data?.created_by ? convertToUser(data.created_by) : undefined,
        updated_by: data?.updated_by ? convertToUser(data.updated_by) : undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface APIEngine {
    required_api: ApiType;
    input_variables: FunctionParameters;
}

export interface ApiComponentProps extends HandleClickProps {
    items: API[] | null;
    item: API | null;
    onChange: (newItem: Partial<API>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onView?: (api: API) => void;
    onInteraction?: (api: API) => void;
    showHeaders?: boolean;
}
export const getDefaultApiForm = (): Partial<API> => ({
    api_type: undefined,
    api_name: undefined,
    name: '',
    is_active: false,
    health_status: 'unknown',
    default_model: undefined,
    api_config: {}
});
