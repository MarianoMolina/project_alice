import { LLMDynamicHandle, LLMChatHistoryMessage, LLMContextOverflowPolicy, LLMStructuredPredictionSetting } from "@lmstudio/sdk";
import dotenv from 'dotenv';
import Logger from "./logger";
dotenv.config();

export interface MessageContent {
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
    };
}

export type ChatRole = 'system' | 'user' | 'assistant' | 'function';

export interface ChatCompletionMessage {
    role: ChatRole;
    content: string | null | MessageContent[];
    name?: string;
    function_call?: any;
}

export function convertToLLMMessage(msg: ChatCompletionMessage): LLMChatHistoryMessage {
    const role = msg.role as string;
    
    if (!msg.content) {
        return {
            role,
            content: ''
        };
    }

    if (typeof msg.content === 'string') {
        return {
            role,
            content: msg.content
        };
    }

    const content = msg.content.map(item => {
        if (item.type === 'text') {
            return item.text || '';
        }
        if (item.type === 'image_url' && item.image_url) {
            return `<image>${item.image_url.url}</image>`;
        }
        return '';
    }).join('\n');

    return {
        role,
        content
    };
}

export function convertFromLLMMessage(msg: LLMChatHistoryMessage): ChatCompletionMessage {
    return {
        role: msg.role as ChatRole,
        content: msg.content
    };
}

export interface LoadedModel {
    model: LLMDynamicHandle;
    lastUsed: number;
}

export type ChatCompletionToolChoiceOption = 'none' | 'auto' | 'required' | ChatCompletionNamedToolChoice;

export function getToolSystemMessages(tools: any[], tool_choice: ChatCompletionToolChoiceOption): Array<ChatCompletionMessage> {
    if (!tools || tools.length === 0 || tool_choice === 'none') {
        return [];
    }

    const systemMessage: ChatCompletionMessage = {
        role: 'system',
        content: `You are a function calling AI model. You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Here are the available tools: <tools> ${JSON.stringify(tools)} </tools> Use the following pydantic model json schema for each tool call you will make: {"properties": {"arguments": {"title": "Arguments", "type": "object"}, "name": {"title": "Name", "type": "string"}}, "required": ["arguments", "name"], "title": "FunctionCall", "type": "object"} For each function call return a json object with function name and arguments within <tool_call></tool_call> XML tags as follows:
<tool_call>
{"arguments": <args-dict>, "name": <function-name>}
</tool_call>`
    };

    return [systemMessage];
}

export function mapStopReason(stopReason: string): string {
    switch (stopReason) {
        case 'eosFound':
            return 'stop';
        case 'maxTokensReached':
            return 'length';
        case 'functionCall':
            return 'function_call';
        case 'toolCalls':
            return 'tool_calls';
        default:
            return 'stop';
    }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise])
        .then((result) => {
            clearTimeout(timeoutHandle);
            return result;
        })
        .catch((error) => {
            clearTimeout(timeoutHandle);
            throw error;
        });
}

export async function callLMStudioMethod<T>(methodName: string, method: () => Promise<T>): Promise<T> {
    try {
        const result = await withTimeout(method(), 120000); // 120 second timeout
        return result;
    } catch (error) {
        Logger.error(`${methodName} failed:`, error);
        throw error;
    }
}

export function isValidJsonContent(content: string): boolean {
    try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
        return false;
    }
}

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

export interface LLMChatResponseOpts {
    maxPredictedTokens?: number;
    temperature?: number;
    stopStrings?: Array<string>;
    contextOverflowPolicy?: LLMContextOverflowPolicy;
    inputPrefix?: string;
    inputSuffix?: string;
    structured?: LLMStructuredPredictionSetting;
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