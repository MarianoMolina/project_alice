import { AliceModel, convertToAliceModel } from "./ModelTypes";
import { convertToUser, User } from "./UserTypes";
import { FunctionParameters } from "./ParameterTypes";
import { HandleClickProps } from "./CollectionTypes";

export enum ApiType {
    LLM_API = 'llm_api',
    REDDIT_SEARCH = 'reddit_search',
    WIKIPEDIA_SEARCH = 'wikipedia_search',
    GOOGLE_SEARCH = 'google_search',
    EXA_SEARCH = 'exa_search',
    ARXIV_SEARCH = 'arxiv_search',
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
    created_at?: Date;
    updated_at?: Date;
}
export interface LLMAPI {
    _id?: string;
    user: User;
    api_type: ApiType.LLM_API;
    api_name: LlmProvider;
    name?: string;
    is_active: boolean;
    health_status: 'healthy' | 'unhealthy' | 'unknown';
    default_model?: AliceModel;
    api_config: { api_key: string, base_url: string  };
    created_by?: User;
    updated_by?: User;
    created_at?: Date;
    updated_at?: Date;
}
export const convertToAPI = (data: any): API => {
    return {
        _id: data?._id || undefined,
        api_type: data?.api_type || ApiType.LLM_API,
        api_name: data?.api_name || '',
        name: data?.name || '',
        is_active: data?.is_active || false,
        health_status: data?.health_status || 'unknown',
        default_model: (data?.default_model && Object.keys(data.default_model).length > 0) ? convertToAliceModel(data.default_model) : undefined,
        api_config: data?.api_config || {},
        created_by: data?.created_by ? convertToUser(data.created_by) : undefined,
        updated_by: data?.updated_by ? convertToUser(data.updated_by) : undefined,
        created_at: data?.created_at ? new Date(data.created_at) : undefined,
        updated_at: data?.updated_at ? new Date(data.updated_at) : undefined,
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
    api_type: ApiType.LLM_API,
    api_name: undefined,
    name: '',
    is_active: false,
    health_status: 'unknown',
    default_model: undefined,
    api_config: {}
});
