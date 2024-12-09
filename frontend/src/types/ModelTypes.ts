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

export interface ModelConfig {
    ctx_size: number;
    temperature: number;
    seed: number | null;
    use_cache: boolean;
    prompt_config: ChatTemplateTokens;
}
export interface AliceModel extends BaseDatabaseObject { 
    short_name: string;
    model_name: string;
    model_type: ModelType;
    api_name: ApiName;
    config_obj: ModelConfig;
}

export const convertToAliceModel = (data: any): AliceModel => {
    return {
        ...convertToBaseDatabaseObject(data),
        short_name: data?.short_name || '',
        model_name: data?.model_name || '',
        model_type: data?.model_type || 'chat',
        api_name: data?.api_name || 'lm_studio',
        config_obj: data?.config_obj || {
            ctx_size: 4096,
            temperature: 0.7,
            seed: null,
            use_cache: true,
            prompt_config: {
                bos: '<|im_start|>',
                eos: '<|im_end|>',
                system_role: 'system',
                user_role: 'user',
                assistant_role: 'assistant',
                tool_role: 'tool'
            }
        },
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
        prompt_config: {
            bos: '<|im_start|>',
            eos: '<|im_end|>',
            system_role: 'system',
            user_role: 'user',
            assistant_role: 'assistant',
            tool_role: 'tool'
        }
    }
});