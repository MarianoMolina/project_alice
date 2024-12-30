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

export type FileProcessingErrorCode = typeof FileProcessingErrorCode[keyof typeof FileProcessingErrorCode];

export interface FileServiceConfig {
    maxFileSize?: number;
    supportedMimeTypes?: string[];
    timeoutMs?: number;
    maxRedirects?: number;
}

interface MimeTypeMapping {
    type: FileType;
    isExperimental?: boolean;
}

export class FileService {
    private readonly maxFileSize: number;
    private readonly timeoutMs: number;
    private readonly maxRedirects: number;
    private readonly supportedMimeTypes: Map<string, MimeTypeMapping>;

    // IPv4 CIDR ranges for private networks
    private readonly PRIVATE_IP_RANGES = [
        { start: '10.0.0.0', end: '10.255.255.255' },       // 10.0.0.0/8
        { start: '172.16.0.0', end: '172.31.255.255' },     // 172.16.0.0/12
        { start: '192.168.0.0', end: '192.168.255.255' },   // 192.168.0.0/16
        { start: '127.0.0.0', end: '127.255.255.255' },     // 127.0.0.0/8
        { start: '169.254.0.0', end: '169.254.255.255' },   // 169.254.0.0/16
        { start: '0.0.0.0', end: '0.255.255.255' },         // 0.0.0.0/8
    ];

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
        this.timeoutMs = config.timeoutMs ?? 30000; // 30 seconds default
        this.maxRedirects = config.maxRedirects ?? 5; // 5 redirects default

        this.supportedMimeTypes = new Map(FileService.DEFAULT_MIME_MAPPINGS);
        if (config.supportedMimeTypes) {
            for (const mime of config.supportedMimeTypes) {
                if (!this.supportedMimeTypes.has(mime)) {
                    this.supportedMimeTypes.set(mime, { type: 'unknown', isExperimental: true });
                }
            }
        }
    }

    private ipToNumber(ip: string): number {
        return ip.split('.')
            .reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
    }

    private isPrivateIP(ip: string): boolean {
        const ipNum = this.ipToNumber(ip);
        return this.PRIVATE_IP_RANGES.some(range => {
            const rangeStart = this.ipToNumber(range.start);
            const rangeEnd = this.ipToNumber(range.end);
            return ipNum >= rangeStart && ipNum <= rangeEnd;
        });
    }

    private async validateUrl(url: string): Promise<URL> {
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new FileProcessingError('Invalid URL format', 'INVALID_URL');
        }

        // Enforce HTTPS only
        if (parsedUrl.protocol !== 'https:') {
            throw new FileProcessingError(
                'Invalid URL protocol. Only HTTPS is allowed',
                'INVALID_PROTOCOL'
            );
        }

        // Block IP addresses in URLs
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^(\[[\da-fA-F:]+\]|[\da-fA-F:]+)$/;

        if (ipv4Regex.test(parsedUrl.hostname) || ipv6Regex.test(parsedUrl.hostname)) {
            throw new FileProcessingError(
                'Direct IP addresses not allowed in URLs',
                'DOMAIN_NOT_ALLOWED'
            );
        }

        // Check for localhost and other restricted hostnames
        const restrictedHosts = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            '[::1]',
            'internal'
        ];

        if (restrictedHosts.some(host =>
            parsedUrl.hostname === host ||
            parsedUrl.hostname.endsWith(`.${host}`))) {
            throw new FileProcessingError(
                'Restricted hostname not allowed',
                'DOMAIN_NOT_ALLOWED'
            );
        }

        return parsedUrl;
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

    private async fetchFromUrl(url: string): Promise<{
        mimeType: string;
        data: Uint8Array;
    }> {
        const parsedUrl = await this.validateUrl(url);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        let redirectCount = 0;

        try {
            while (redirectCount <= this.maxRedirects) {
                const response = await fetch(parsedUrl.toString(), {
                    signal: controller.signal,
                    headers: {
                        'Accept': Array.from(this.supportedMimeTypes.keys()).join(', '),
                    },
                    redirect: 'manual',
                });

                // Handle redirects
                if (response.status >= 300 && response.status < 400) {
                    const redirectUrl = response.headers.get('location');
                    if (!redirectUrl) {
                        throw new FileProcessingError(
                            'Invalid redirect URL',
                            'REDIRECT_ERROR'
                        );
                    }

                    // Validate the redirect URL BEFORE creating a new request
                    const nextUrl = new URL(redirectUrl, parsedUrl).toString();
                    const validatedRedirectUrl = await this.validateUrl(nextUrl);

                    // Only after validation do we update parsedUrl
                    Object.assign(parsedUrl, validatedRedirectUrl);
                    redirectCount++;
                    continue;
                }

                if (!response.ok) {
                    throw new FileProcessingError(
                        `Failed to fetch file: ${response.status} ${response.statusText}`,
                        'FETCH_FAILED'
                    );
                }

                const contentType = response.headers.get('content-type');
                const mimeType = contentType?.split(';')[0] || 'application/octet-stream';

                if (!this.supportedMimeTypes.has(mimeType)) {
                    throw new FileProcessingError(
                        'Unsupported file type',
                        'INVALID_MIME_TYPE'
                    );
                }

                const arrayBuffer = await response.arrayBuffer();
                const data = new Uint8Array(arrayBuffer);

                if (data.length > this.maxFileSize) {
                    throw new FileProcessingError(
                        'File size exceeds maximum allowed size',
                        'FILE_TOO_LARGE'
                    );
                }

                return { mimeType, data };
            }

            throw new FileProcessingError(
                'Too many redirects',
                'REDIRECT_ERROR'
            );
        } catch (error) {
            if (error instanceof FileProcessingError) throw error;

            if (error instanceof Error && error.name === 'AbortError') {
                throw new FileProcessingError(
                    'Request timed out',
                    'TIMEOUT_ERROR'
                );
            }

            throw new FileProcessingError(
                `Failed to fetch file: ${error}`,
                'NETWORK_ERROR'
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
                'FILE_TOO_LARGE'
            );
        }
    }

    async processMessageContent(content: MessageContent): Promise<{
        type: string;
        text?: string;
        file?: FileHandle;
    }> {
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
            const fileData = await this.processBase64String(content.data, 'audio/wav');
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