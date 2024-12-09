import { FileHandle, FilesNamespace, FileType } from "@lmstudio/sdk";
import { MessageContent } from "./lmStudio.types";

export class FileProcessingError extends Error {
    constructor(
        message: string,
        public readonly code: 'FETCH_FAILED' | 'INVALID_URL' | 'UNSUPPORTED_TYPE' | 'UPLOAD_FAILED' | 'INVALID_BASE64'
    ) {
        super(message);
        this.name = 'FileProcessingError';
    }
}

export interface FileServiceConfig {
    maxFileSize?: number;
    supportedMimeTypes?: string[];
}

interface MimeTypeMapping {
    type: FileType;
    isExperimental?: boolean;
}

export class FileService {
    private readonly maxFileSize: number;
    private readonly supportedMimeTypes: Map<string, MimeTypeMapping>;

    private static readonly DEFAULT_MIME_MAPPINGS = new Map<string, MimeTypeMapping>([
        // Images
        ['image/jpeg', { type: 'image' }],
        ['image/png', { type: 'image' }],
        ['image/gif', { type: 'image' }],
        ['image/webp', { type: 'image' }],
        // Audio (experimental)
        ['audio/wav', { type: 'unknown', isExperimental: true }],
        ['audio/mpeg', { type: 'unknown', isExperimental: true }],
        ['audio/ogg', { type: 'unknown', isExperimental: true }],
        ['audio/webm', { type: 'unknown', isExperimental: true }]
    ]);

    constructor(
        private readonly filesNamespace: FilesNamespace,
        config: FileServiceConfig = {}
    ) {
        this.maxFileSize = config.maxFileSize ?? 20 * 1024 * 1024; // 20MB default
        this.supportedMimeTypes = new Map(FileService.DEFAULT_MIME_MAPPINGS);
        
        if (config.supportedMimeTypes) {
            for (const mime of config.supportedMimeTypes) {
                if (!this.supportedMimeTypes.has(mime)) {
                    this.supportedMimeTypes.set(mime, { type: 'unknown', isExperimental: true });
                }
            }
        }
    }

    private isBase64DataUrl(url: string): boolean {
        return url.startsWith('data:');
    }

    private async processBase64DataUrl(dataUrl: string): Promise<{
        mimeType: string;
        data: Uint8Array;
    }> {
        try {
            const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                throw new FileProcessingError(
                    'Invalid data URL format',
                    'INVALID_BASE64'
                );
            }

            const [, mimeType, base64Data] = matches;
            const binaryString = atob(base64Data);
            const data = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                data[i] = binaryString.charCodeAt(i);
            }

            return { mimeType, data };
        } catch (error) {
            if (error instanceof FileProcessingError) throw error;
            throw new FileProcessingError(
                `Failed to process base64 data: ${error}`,
                'INVALID_BASE64'
            );
        }
    }

    private async processBase64String(base64Data: string, mimeType: string): Promise<{
        mimeType: string;
        data: Uint8Array;
    }> {
        try {
            const binaryString = atob(base64Data);
            const data = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                data[i] = binaryString.charCodeAt(i);
            }

            return { mimeType, data };
        } catch (error) {
            throw new FileProcessingError(
                `Failed to process base64 data: ${error}`,
                'INVALID_BASE64'
            );
        }
    }

    private async fetchFromUrl(url: string, timeoutMs: number = 30000): Promise<{
        mimeType: string;
        data: Uint8Array;
    }> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new FileProcessingError(
                    `Failed to fetch file: ${response.status} ${response.statusText}`,
                    'FETCH_FAILED'
                );
            }

            const mimeType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);

            return { mimeType, data };
        } catch (error) {
            if (error instanceof FileProcessingError) throw error;
            throw new FileProcessingError(
                `Failed to fetch file: ${error}`,
                'FETCH_FAILED'
            );
        } finally {
            clearTimeout(timeout);
        }
    }

    private validateFileType(mimeType: string): MimeTypeMapping {
        const mapping = this.supportedMimeTypes.get(mimeType);
        if (!mapping) {
            throw new FileProcessingError(
                `Unsupported file type: ${mimeType}`,
                'UNSUPPORTED_TYPE'
            );
        }
        return mapping;
    }

    private validateFileSize(data: Uint8Array): void {
        if (data.length > this.maxFileSize) {
            throw new FileProcessingError(
                `File too large: ${data.length} bytes (max ${this.maxFileSize} bytes)`,
                'UPLOAD_FAILED'
            );
        }
    }

    async processMessageContent(content: MessageContent): Promise<{
        type: string;
        text?: string;
        file?: FileHandle;
    }> {
        // Messages incoming to an OpenAI API endpoint cannot be any other type than text, image_url, or audio
        if (content.type === 'text') {
            return { type: 'text', text: content.text || '' };
        }

        if (content.type === 'image_url' && content.image_url) {
            let fileData: { mimeType: string; data: Uint8Array };
            
            if (this.isBase64DataUrl(content.image_url.url)) {
                fileData = await this.processBase64DataUrl(content.image_url.url);
            } else {
                fileData = await this.fetchFromUrl(content.image_url.url);
            }

            this.validateFileType(fileData.mimeType);
            this.validateFileSize(fileData.data);

            const fileHandle = await this.filesNamespace.uploadTempFile(
                `image_${Date.now()}.${fileData.mimeType.split('/')[1]}`,
                fileData.data
            );

            return { type: 'file', file: fileHandle };
        }

        if (content.type === 'audio') {
            // Handle audio (base64 only)
            const fileData = await this.processBase64String(content.data, 'audio/wav'); // Default to WAV
            this.validateFileType(fileData.mimeType);
            this.validateFileSize(fileData.data);

            const fileHandle = await this.filesNamespace.uploadTempFile(
                `audio_${Date.now()}.wav`,
                fileData.data
            );

            return { type: 'file', file: fileHandle };
        }

        throw new FileProcessingError(
            `Invalid or unsupported content: ${JSON.stringify(content)}`,
            'UNSUPPORTED_TYPE'
        );
    }
}