import { FileHandle, FilesNamespace, FileType } from "@lmstudio/sdk";
import { MessageContent } from "./lmStudio.types";

export class FileProcessingError extends Error {
    constructor(
        message: string,
        public readonly code: 
            | 'FETCH_FAILED' 
            | 'INVALID_URL' 
            | 'INVALID_PROTOCOL'
            | 'DOMAIN_NOT_ALLOWED'
            | 'FILE_TOO_LARGE'
            | 'INVALID_MIME_TYPE'
            | 'UNSUPPORTED_TYPE' 
            | 'UPLOAD_FAILED' 
            | 'INVALID_BASE64'
            | 'REDIRECT_ERROR'
            | 'TIMEOUT_ERROR'
            | 'NETWORK_ERROR'
    ) {
        super(message);
        this.name = 'FileProcessingError';
        
        // Maintain proper stack traces for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, FileProcessingError);
        }
    }

    public toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            stack: this.stack
        };
    }
}

// Optional: Add error code constants for better maintainability
export const FileProcessingErrorCode = {
    FETCH_FAILED: 'FETCH_FAILED',
    INVALID_URL: 'INVALID_URL',
    INVALID_PROTOCOL: 'INVALID_PROTOCOL',
    DOMAIN_NOT_ALLOWED: 'DOMAIN_NOT_ALLOWED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
    UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
    INVALID_BASE64: 'INVALID_BASE64',
    REDIRECT_ERROR: 'REDIRECT_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

// Type for error codes
export type FileProcessingErrorCode = typeof FileProcessingErrorCode[keyof typeof FileProcessingErrorCode];

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
        // URL validation and sanitization
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new FileProcessingError('Invalid URL format', 'INVALID_URL');
        }
    
        // Whitelist of allowed protocols
        const allowedProtocols = ['https:', 'http:'];
        if (!allowedProtocols.includes(parsedUrl.protocol)) {
            throw new FileProcessingError(
                'Invalid URL protocol. Only HTTP and HTTPS are allowed',
                'INVALID_PROTOCOL'
            );
        }
    
        // Optional: Whitelist of allowed domains
        const allowedDomains = [
            'trusted-domain.com',
            'api.trusted-domain.com'
            // Add your whitelist of domains
        ];
        if (!allowedDomains.includes(parsedUrl.hostname)) {
            throw new FileProcessingError(
                'Domain not allowed',
                'DOMAIN_NOT_ALLOWED'
            );
        }
    
        // Optional: Size limit for downloads
        const maxSize = 50 * 1024 * 1024; // 50MB example limit
    
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
            const response = await fetch(parsedUrl.toString(), {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json, application/octet-stream',
                    'Accept-Encoding': 'gzip, deflate, br'
                },
                // Use redirect option to control redirect behavior
                redirect: 'follow',
            });
    
            if (!response.ok) {
                throw new FileProcessingError(
                    `Failed to fetch file: ${response.status} ${response.statusText}`,
                    'FETCH_FAILED'
                );
            }
    
            // Check content length if available
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > maxSize) {
                throw new FileProcessingError(
                    'File size exceeds maximum allowed size',
                    'FILE_TOO_LARGE'
                );
            }
    
            const mimeType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
            
            // Optional: Whitelist of allowed MIME types
            const allowedMimeTypes = [
                'application/json',
                'application/octet-stream',
                // Add your allowed MIME types
            ];
            if (!allowedMimeTypes.includes(mimeType)) {
                throw new FileProcessingError(
                    'Unsupported file type',
                    'INVALID_MIME_TYPE'
                );
            }
    
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
    
            // Double-check actual size after download
            if (data.length > maxSize) {
                throw new FileProcessingError(
                    'File size exceeds maximum allowed size',
                    'FILE_TOO_LARGE'
                );
            }
    
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