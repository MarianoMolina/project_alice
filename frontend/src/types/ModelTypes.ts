import { ApiName } from "./ApiTypes";
import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";

export enum ModelType {
    INSTRUCT = 'instruct',
    CHAT = 'chat',
    VISION = 'vision',
    STT = 'stt',
    TTS = 'tts',
    EMBEDDINGS = 'embeddings',
    IMG_GEN = 'img_gen',
}
export interface ChatTemplateTokens {
    bos: string;
    eos: string;
    // Optional role markers, if undefined will use default
    system_role?: string;
    user_role?: string;
    assistant_role?: string;
    tool_role?: string;
}

export interface ModelCosts {
    input_token_cost_per_million: number;
    cached_input_token_cost_per_million: number;
    output_token_cost_per_million: number;
}

export interface ModelConfig {
    ctx_size: number;
    temperature: number;
    seed: number | null;
    use_cache: boolean;
    prompt_config: ChatTemplateTokens;
    max_tokens_gen?: number;
}
export interface AliceModel extends BaseDatabaseObject { 
    short_name: string;
    model_name: string;
    model_type: ModelType;
    api_name: ApiName;
    config_obj?: ModelConfig;
    model_costs?: ModelCosts;
}

export const convertToAliceModel = (data: any): AliceModel => {
    return {
        ...convertToBaseDatabaseObject(data),
        short_name: data?.short_name || '',
        model_name: data?.model_name || '',
        model_type: data?.model_type || 'chat',
        api_name: data?.api_name || 'lm_studio',
        config_obj: data?.config_obj || {},
    };
};

export interface ModelComponentProps extends EnhancedComponentProps<AliceModel> {
    
}

export const getDefaultModelForm = (): Partial<AliceModel> => ({
    short_name: '',
    model_name: '',
    model_type: undefined,
    api_name: undefined,
    config_obj: {
        ctx_size: 4096,
        temperature: 0.7,
        seed: null,
        use_cache: true,
        max_tokens_gen: 4096,
        prompt_config: {
            bos: '<|im_start|>',
            eos: '<|im_end|>',
            system_role: 'system',
            user_role: 'user',
            assistant_role: 'assistant',
            tool_role: 'tool'
        }
    },
    model_costs: {
        input_token_cost_per_million: 0.15,
        cached_input_token_cost_per_million: 0.075,
        output_token_cost_per_million: 0.6
    }

});