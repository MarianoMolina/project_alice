import Logger from "../utils/logger";
import { v4 as uuidv4 } from 'uuid';
import { ToolCall } from './lmStudio.types';
import { ChatMessagePartData } from "@lmstudio/sdk";

export interface CreateEmbeddingParams {
    model: string;
    input: string | string[];
    encoding_format?: 'float' | 'base64';
    user?: string;
}

export interface CreateEmbeddingResponse {
    object: 'list';
    data: Array<{
        object: 'embedding';
        embedding: number[];
        index: number;
    }>;
    model: string;
    usage: {
        prompt_tokens: number;
        total_tokens: number;
    };
}

export function retrieveToolCalls(content: string): ToolCall[] | false {
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    const toolCalls: ToolCall[] = [];
    Logger.debug(`Retrieving tool calls from content:`, content);
    let match;

    while ((match = toolCallRegex.exec(content)) !== null) {
        let rawToolCall = match[1].trim();
        Logger.debug('Raw tool call:', rawToolCall);

        try {
            // Attempt to unescape the JSON string if it's escaped
            try {
                rawToolCall = JSON.parse(`"${rawToolCall.replace(/"/g, '\\"')}"`);
            } catch (unescapeError) {
                Logger.debug('Unescaping failed, proceeding with raw string');
            }

            Logger.debug('Unescaped/raw tool call:', rawToolCall);

            // Parse the JSON
            const toolCallJson = JSON.parse(rawToolCall);

            // Validate the parsed JSON structure
            if (typeof toolCallJson.name === 'string' && toolCallJson.arguments !== undefined) {
                toolCalls.push({
                    id: uuidv4(),
                    type: "function",
                    function: {
                        name: toolCallJson.name,
                        arguments: typeof toolCallJson.arguments === 'string'
                            ? toolCallJson.arguments
                            : JSON.stringify(toolCallJson.arguments)
                    }
                });
            } else {
                Logger.warn('Invalid tool call structure:', toolCallJson);
            }
        } catch (error) {
            Logger.error('Error parsing tool call:', error);
            Logger.error('Problematic JSON string:', rawToolCall);

            // Attempt to recover from common JSON errors
            try {
                const correctedJson = rawToolCall
                    .replace(/'/g, '"')  // Replace single quotes with double quotes
                    .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
                    .replace(/,\s*([\]}])/g, '$1')  // Remove trailing commas
                    .replace(/\\/g, '');  // Remove any remaining backslashes

                const toolCallJson = JSON.parse(correctedJson);

                if (typeof toolCallJson.name === 'string' && toolCallJson.arguments !== undefined) {
                    Logger.debug('Successfully recovered from JSON error');
                    toolCalls.push({
                        id: uuidv4(),
                        type: "function",
                        function: {
                            name: toolCallJson.name,
                            arguments: typeof toolCallJson.arguments === 'string'
                                ? toolCallJson.arguments
                                : JSON.stringify(toolCallJson.arguments)
                        }
                    });
                } else {
                    Logger.warn('Invalid tool call structure after recovery attempt:', toolCallJson);
                }
            } catch (recoveryError) {
                Logger.error('Failed to recover from JSON error:', recoveryError);
            }
        }
    }

    Logger.debug('Processed tool calls:', toolCalls);

    return toolCalls.length > 0 ? toolCalls : false;
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

export function isValidJsonContent(content: string): boolean {
    try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
        return false;
    }
}

export function simplifyContent(content: ChatMessagePartData[]): string {
    return content.map(part => {
        switch (part.type) {
            case "text":
                return part.text;
            case "file":
                return `<file>${part.identifier}</file>`;
            case "toolCallRequest":
                return `<tool_call>${JSON.stringify({
                    name: part.toolCallRequests[0].function.name,
                    arguments: part.toolCallRequests[0].function.arguments
                })}</tool_call>`;
            case "toolCallResult":
                return part.content;
            default:
                return '';
        }
    }).join('');
}
