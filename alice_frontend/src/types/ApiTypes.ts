import { AliceModel, convertToAliceModel } from "./ModelTypes";
import { convertToUser, User } from "./UserTypes";
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
    WEB_SCRAPE = 'web_scrape',
    SPEECH_TO_TEXT = 'speech_to_text',
    TEXT_TO_SPEECH = 'text_to_speech',
    EMBEDDINGS = 'embeddings',
  }
export enum LlmProvider {
    OPENAI = 'openai',
    AZURE = 'azure',
    ANTHROPIC = 'anthropic',
    LM_STUDIO = 'lm-studio',
}
export interface API {
    _id?: string;
    api_type: ApiType;
    api_name: ApiType | LlmProvider | undefined;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: { [key: string]: string };
    created_by?: User;
    updated_by?: User;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface LLMAPI {
    _id?: string;
    user: User;
    api_type: ApiType.LLM_MODEL;
    api_name: LlmProvider;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: { api_key: string, base_url: string  };
    created_by?: User;
    updated_by?: User;
    createdAt?: Date;
    updatedAt?: Date;
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
    apiType?: ApiType;
}
export const getDefaultApiForm = (): Partial<API> => ({
    api_type: ApiType.LLM_MODEL,
    api_name: undefined,
    name: '',
    is_active: false,
    health_status: 'unknown',
    default_model: undefined,
    api_config: {}
});
