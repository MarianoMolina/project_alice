import { FileService } from './fileService';
import {
    LLMPromptTemplate, LLMJinjaPromptTemplate, ChatMessagePartTextData, ChatMessagePartFileData, ChatHistory, ChatMessageData,
    ChatMessagePartData, ChatMessagePartToolCallResultData, ChatMessagePartToolCallRequestData
} from '@lmstudio/sdk';
import Logger from '../utils/logger';
import { ChatCompletionMessage, ChatCompletionParams, ChatTemplateTokens, CompletionParams, DEFAULT_TOKENS, MessageContent, ToolCall } from './lmStudio.types';

export class MessageBuilder {
    constructor(private readonly fileService: FileService) { }

    private async processContentArray(contentArray: MessageContent[]): Promise<Array<ChatMessagePartTextData | ChatMessagePartFileData>> {
        const processedContent: Array<ChatMessagePartTextData | ChatMessagePartFileData> = [];

        for (const item of contentArray) {
            const processed = await this.fileService.processMessageContent(item);
            if (processed.type === 'text' && processed.text) {
                processedContent.push({
                    type: 'text',
                    text: processed.text
                });
            } else if (processed.type === 'file' && processed.file) {
                processedContent.push({
                    type: 'file',
                    name: processed.file.name,
                    identifier: processed.file.identifier,
                    sizeBytes: processed.file.sizeBytes,
                    fileType: processed.file.type
                });
            }
        }

        return processedContent;
    }

    private async processToolCalls(toolCalls: ToolCall[]): Promise<ChatMessagePartToolCallRequestData> {
        return {
            type: "toolCallRequest",
            toolCallRequests: toolCalls.map(toolCall => ({
                type: "function",
                function: {
                    name: toolCall.function.name,
                    arguments: JSON.parse(toolCall.function.arguments)
                }
            }))
        };
    }

    private async processAssistantMessage(msg: ChatCompletionMessage): Promise<ChatMessageData> {
        const content: Array<ChatMessagePartTextData | ChatMessagePartFileData | ChatMessagePartToolCallRequestData> = [];

        // Handle content
        if (msg.content === null) {
            content.push({ type: "text", text: "" });
        } else if (typeof msg.content === 'string') {
            content.push({ type: "text", text: msg.content });
        } else {
            content.push(...await this.processContentArray(msg.content));
        }

        // Handle tool calls
        if (msg.tool_calls && msg.tool_calls.length > 0) {
            try {
                content.push(await this.processToolCalls(msg.tool_calls));
            } catch (error) {
                Logger.error('Error processing tool calls:', error);
            }
        }

        return { role: "assistant", content };
    }

    private async processUserOrSystemMessage(msg: ChatCompletionMessage): Promise<ChatMessageData> {
        const content: Array<ChatMessagePartTextData | ChatMessagePartFileData> = [];

        if (msg.content === null) {
            content.push({ type: "text", text: "" });
        } else if (typeof msg.content === 'string') {
            content.push({ type: "text", text: msg.content });
        } else {
            content.push(...await this.processContentArray(msg.content));
        }

        return {
            role: msg.role as "user" | "system",
            content
        };
    }

    private processToolMessage(msg: ChatCompletionMessage): ChatMessageData {
        const content: Array<ChatMessagePartToolCallResultData> = [{
            type: "toolCallResult",
            content: typeof msg.content === 'string' ? msg.content :
                msg.content ? JSON.stringify(msg.content) : '',
            toolCallId: msg.name
        }];

        return { role: "tool", content };
    }

    public async processMessage(msg: ChatCompletionMessage): Promise<ChatMessageData> {
        switch (msg.role) {
            case 'assistant':
                return this.processAssistantMessage(msg);
            case 'user':
            case 'system':
                return this.processUserOrSystemMessage(msg);
            case 'tool':
                return this.processToolMessage(msg);
            default:
                throw new Error(`Unsupported role: ${msg.role}`);
        }
    }
    
    public async buildChatHistory(params: ChatCompletionParams, tokens: Partial<ChatTemplateTokens> = DEFAULT_TOKENS): Promise<{
        history: ChatHistory;
        promptTemplate: LLMPromptTemplate;
    }> {
        const processedMessages: ChatMessageData[] = [];

        for (const msg of params.messages) {
            const processed = await this.processMessage(msg);
            processedMessages.push(processed);
        }
        Logger.debug('Processed messages:', processedMessages);

        return {
            history: ChatHistory.from({ messages: processedMessages }),
            promptTemplate: this.createPromptTemplate(tokens, params)
        };
    }

    private createBaseTemplate(tokens: ChatTemplateTokens): string {
        const {
            system_role = DEFAULT_TOKENS.system_role,
            user_role = DEFAULT_TOKENS.user_role,
            assistant_role = DEFAULT_TOKENS.assistant_role,
            tool_role = DEFAULT_TOKENS.tool_role
        } = tokens;

        return `
{%- for message in messages -%}
{%- if message.role == '${system_role}' -%}
${tokens.bos}${system_role}
{{ message.content }}
${tokens.eos}
{%- elif message.role == '${user_role}' -%}
${tokens.bos}${user_role}
{{ message.content }}
${tokens.eos}
{%- elif message.role == '${assistant_role}' -%}
${tokens.bos}${assistant_role}
{{ message.content }}
${tokens.eos}
{%- elif message.role == '${tool_role}' -%}
${tokens.bos}${tool_role}
{{ message.content }}
${tokens.eos}
{%- endif %}
{%- endfor -%}
${tokens.bos}${assistant_role}
`;
    }

    private createToolsTemplate(tokens: ChatTemplateTokens): string {
        return `
{%- if 'tools' in tools %}
{% set tool_string = tools.tools | tojson %}
{% else %}
{% set tool_string = '[]' %}
{% endif -%}
${this.createBaseTemplate(tokens)}`;
    }

    public createPromptTemplate(tokens: Partial<ChatTemplateTokens> = {}, params?: ChatCompletionParams | CompletionParams): LLMPromptTemplate {
        const fullTokens: ChatTemplateTokens = {
            ...DEFAULT_TOKENS,
            ...tokens
        };

        const hasTools = params && 'tools' in params && params?.tools && params.tools.length > 0 && params.tool_choice !== 'none';

        const template: LLMJinjaPromptTemplate = {
            template: hasTools ? this.createToolsTemplate(fullTokens) : this.createBaseTemplate(fullTokens),
            bosToken: fullTokens.bos,
            eosToken: fullTokens.eos,
            inputFormat: hasTools ? "llamaCustomTools" : "promptOnly"
        };

        return {
            type: "jinja",
            jinjaPromptTemplate: template,
            stopStrings: [fullTokens.bos, fullTokens.eos]
        };
    }
}
