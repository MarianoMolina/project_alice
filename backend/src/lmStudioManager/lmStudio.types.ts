import {
    EmbeddingDynamicHandle,
    LLMDynamicHandle, 
    LLMLoadModelConfig, 
    LLMManualPromptTemplate,
    LLMPromptTemplate
} from "@lmstudio/sdk";
import dotenv from 'dotenv';
dotenv.config();

// Updated interfaces to match OpenAI's structure
export interface ImageUrlContent {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
}

export interface ImageBase64Content {
    type: 'image_url';
    image_url: {
        url: `data:image/${string};base64,${string}`;  // Enforce data URL format
        detail?: 'low' | 'high' | 'auto';
    };
}

export interface AudioContent {
    type: 'audio';
    data: string;  // Base64 encoded audio data
}

export interface TextContent {
    type: 'text';
    text?: string;
}

export type MessageContent = TextContent | ImageUrlContent | ImageBase64Content | AudioContent;

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatCompletionMessage {
    role: ChatRole;
    content: string | null | MessageContent[];
    name?: string;
    tool_calls?: ToolCall[];
}

export interface LoadedModel {
    model: LLMDynamicHandle | EmbeddingDynamicHandle;
    lastUsed: number;
    type: 'llm' | 'embedding';
}

export type ChatCompletionToolChoiceOption = 'none' | 'auto' | 'required' | ChatCompletionNamedToolChoice;

export interface ResponseFormatJSONObject {
    type: 'json_object';
}

export interface ResponseFormatJSONSchema {
    json_schema: ResponseFormatJSONSchema.JSONSchema;
    type: 'json_schema';
}

export namespace ResponseFormatJSONSchema {
    export interface JSONSchema {
        name: string;
        description?: string;
        schema?: Record<string, unknown>;
        strict?: boolean | null;
    }
}

export interface ResponseFormatText {
    type: 'text';
}

export interface ChatCompletionNamedToolChoice {
    function: ChatCompletionNamedToolChoice.Function;
    type: 'function';
}

export namespace ChatCompletionNamedToolChoice {
    export interface Function {
        name: string;
    }
}

export type FunctionParameters = Record<string, unknown>;

export interface FunctionDefinition {
    name: string;
    description?: string;
    parameters?: FunctionParameters;
    strict?: boolean | null;
}

export interface ChatCompletionTool {
    function: FunctionDefinition;
    type: 'function';
}

export interface ChatCompletionStreamOptions {
    include_usage?: boolean;
}

export interface ChatCompletionParams {
    messages: Array<ChatCompletionMessage>;
    model: string;
    frequency_penalty?: number | null;
    logit_bias?: Record<string, number> | null;
    logprobs?: boolean | null;
    max_tokens?: number | null;
    n?: number | null;
    parallel_tool_calls?: boolean;
    presence_penalty?: number | null;
    response_format?: ResponseFormatText | ResponseFormatJSONObject | ResponseFormatJSONSchema;
    seed?: number | null;
    service_tier?: 'auto' | 'default' | null;
    stop?: string | null | Array<string>;
    stream?: boolean | null;
    stream_options?: ChatCompletionStreamOptions | null;
    temperature?: number | null;
    tool_choice?: ChatCompletionToolChoiceOption;
    tools?: Array<ChatCompletionTool>;
    top_logprobs?: number | null;
    top_p?: number | null;
    user?: string;
}

export interface ChatCompletionResponse {
    id: string;
    object: "chat.completion";
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: "assistant";
            content: string | null;
            tool_calls?: Array<ToolCall>;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface ToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}

export interface CompletionParams {
    prompt: string;
    model: string;
    frequency_penalty?: number | null;
    logit_bias?: Record<string, number> | null;
    logprobs?: boolean | null;
    max_tokens?: number | null;
    n?: number | null;
    presence_penalty?: number | null;
    seed?: number | null;
    service_tier?: 'auto' | 'default' | null;
    stop?: string | null | Array<string>;
    stream?: boolean | null;
    temperature?: number | null;
    top_logprobs?: number | null;
    top_p?: number | null;
    user?: string;
}

export interface CompletionResponse {
    id: string;
    object: "text_completion";
    created: number;
    model: string;
    choices: Array<{
        text: string;
        index: number;
        logprobs: any | null;
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export const DEFAULT_MANUAL_TEMPLATE: LLMManualPromptTemplate = {
    beforeSystem: "<|im_start|>system\n",
    afterSystem: "<|im_end|>\n",
    beforeUser: "<|im_start|>user\n",
    afterUser: "<|im_end|>\n",
    beforeAssistant: "<|im_start|>assistant\n",
    afterAssistant: "<|im_end|>\n"
};

export const DEFAULT_PROMPT_TEMPLATE: LLMPromptTemplate = {
    type: "manual",
    manualPromptTemplate: DEFAULT_MANUAL_TEMPLATE,
    stopStrings: ["<|im_start|>", "<|im_end|>"]
};


export const DEFAULT_MODEL_CONFIG: LLMLoadModelConfig = {
    contextLength: 4096,
    keepModelInMemory: true,
    gpuOffload: {
        ratio: "max",
        mainGpu: 0,
        tensorSplit: []
    }
};

export const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'host.docker.internal:1234';

export interface ChatTemplateTokens {
    bos: string;
    eos: string;
    // Optional role markers, if undefined will use default
    system_role?: string;
    user_role?: string;
    assistant_role?: string;
    tool_role?: string;
}

export const DEFAULT_TOKENS: ChatTemplateTokens = {
    bos: "<|im_start|>",
    eos: "<|im_end|>",
    system_role: "system",
    user_role: "user",
    assistant_role: "assistant",
    tool_role: "tool"
};