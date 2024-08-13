import { LLMDynamicHandle, LLMChatHistoryMessage, LLMContextOverflowPolicy, LLMStructuredPredictionSetting } from "@lmstudio/sdk";
import dotenv from 'dotenv';
import Logger from "./logger";
dotenv.config();

export interface LoadedModel {
    model: LLMDynamicHandle;
    lastUsed: number;
}
export type ChatCompletionToolChoiceOption = 'none' | 'auto' | 'required' | ChatCompletionNamedToolChoice;

export function getToolSystemMessages(tools: any[], tool_choice: ChatCompletionToolChoiceOption): Array<LLMChatHistoryMessage> {
    if (!tools || tools.length === 0 || tool_choice === 'none') {
        return [];
    }

    const systemMessage: LLMChatHistoryMessage = {
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
        console.error(`${methodName} failed:`, error);
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

    /**
     * The type of the tool. Currently, only `function` is supported.
     */
    type: 'function';
}

export namespace ChatCompletionNamedToolChoice {
    export interface Function {
        /**
         * The name of the function to call.
         */
        name: string;
    }
}
export type FunctionParameters = Record<string, unknown>;
export interface FunctionDefinition {
    name: string;
    description?: string;
    parameters?: FunctionParameters;
    /**
     * Whether to enable strict schema adherence when generating the function call. If
     * set to true, the model will follow the exact schema defined in the `parameters`
     * field. Only a subset of JSON Schema is supported when `strict` is `true`. Learn
     * more about Structured Outputs in the
     * [function calling guide](docs/guides/function-calling).
     */
    strict?: boolean | null;
}
export interface ChatCompletionTool {
    function: FunctionDefinition;

    /**
     * The type of the tool. Currently, only `function` is supported.
     */
    type: 'function';
}
export interface ChatCompletionStreamOptions {
    /**
     * If set, an additional chunk will be streamed before the `data: [DONE]` message.
     * The `usage` field on this chunk shows the token usage statistics for the entire
     * request, and the `choices` field will always be an empty array. All other chunks
     * will also include a `usage` field, but with a null value.
     */
    include_usage?: boolean;
  }

export type ChatCompletionParams = {
    messages: Array<LLMChatHistoryMessage>;
    model: (string & {});
    frequency_penalty?: number | null;
    logit_bias?: Record<string, number> | null;
    logprobs?: boolean | null;
    max_tokens?: number | null;
    n?: number | null;
    parallel_tool_calls?: boolean;
    presence_penalty?: number | null;
    response_format?:
    | ResponseFormatText
    | ResponseFormatJSONObject
    | ResponseFormatJSONSchema;
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
export declare interface LLMChatResponseOpts {
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
            tool_calls?: Array<{
                id: string;
                type: "function";
                function: {
                    name: string;
                    arguments: string;
                };
            }>;
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
export type CompletionParams = {
    prompt: string;
    model: (string & {});
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