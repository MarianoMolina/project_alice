import { FileContentReference, FileReference, FileType, PopulatedFileReference } from '../types/FileTypes';
import Logger from './Logger';

export const FileTypeExtensionsMap: Record<FileType, string[]> = {
    [FileType.IMAGE]: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    [FileType.AUDIO]: ['mp3', 'wav', 'ogg', 'flac'],
    [FileType.VIDEO]: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
    [FileType.FILE]: ['txt', 'md', 'csv', 'json', 'tsx', 'ts', 'js', 'html', 'css', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'tar', 'gz'],
};


export const inferFileType = (filename: string): FileType => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return FileType.FILE;

    for (const [fileType, extensions] of Object.entries(FileTypeExtensionsMap)) {
        if (extensions.includes(ext)) {
            return fileType as FileType;
        }
    }

    return FileType.FILE;
};

export const createFileContentReference = async (file: File): Promise<FileContentReference> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && event.target.result) {
                const base64Content = event.target.result.toString().split(',')[1];
                resolve({
                    filename: file.name,
                    type: inferFileType(file.name),
                    content: base64Content,
                    file_size: file.size,
                });
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Check against our FileTypeExtensionsMap first
    for (const [fileType, extensions] of Object.entries(FileTypeExtensionsMap)) {
        if (extensions.includes(ext)) {
            switch (fileType) {
                case FileType.FILE:
                    return getMimeTypeForText(ext);
                case FileType.IMAGE:
                    return `image/${ext}`;
                case FileType.AUDIO:
                    return `audio/${ext}`;
                case FileType.VIDEO:
                    return `video/${ext}`;
            }
        }
    }

    // If not found in our map, use a more extensive list of MIME types
    switch (ext) {
        // Images
        case 'svg': return 'image/svg+xml';
        case 'webp': return 'image/webp';
        case 'tiff': return 'image/tiff';
        case 'ico': return 'image/x-icon';

        // Audio
        case 'midi': case 'mid': return 'audio/midi';
        case 'weba': return 'audio/webm';
        case 'aac': return 'audio/aac';

        // Video
        case 'webm': return 'video/webm';
        case '3gp': return 'video/3gpp';
        case 'ts': return 'video/mp2t';

        // Documents
        case 'pdf': return 'application/pdf';
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        // Archives
        case 'zip': return 'application/zip';
        case 'rar': return 'application/x-rar-compressed';
        case '7z': return 'application/x-7z-compressed';
        case 'tar': return 'application/x-tar';
        case 'gz': return 'application/gzip';

        // Code
        case 'js': return 'application/javascript';
        case 'html': return 'text/html';
        case 'css': return 'text/css';
        case 'xml': return 'application/xml';

        default: return 'application/octet-stream';
    }
};

const getMimeTypeForText = (ext: string): string => {
    switch (ext) {
        case 'txt': return 'text/plain';
        case 'html': return 'text/html';
        case 'css': return 'text/css';
        case 'csv': return 'text/csv';
        case 'json': return 'application/json';
        case 'xml': return 'application/xml';
        case 'md': return 'text/markdown';
        default: return 'text/plain';
    }
};

export const selectFile = async (
    allowedTypes: FileType[] = Object.values(FileType)
): Promise<File | null> => {
    return new Promise((resolve) => {
        Logger.info('Selecting file...');
        Logger.debug('Allowed file types:', allowedTypes);
        const input = document.createElement('input');
        input.type = 'file';
        const allowedExtensions = allowedTypes.flatMap(type => FileTypeExtensionsMap[type]);
        if (allowedExtensions.length > 0) {
            input.accept = allowedExtensions.map(ext => `.${ext}`).join(',');
        }
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
                resolve(null);
                return;
            }
            const fileType = inferFileType(file.name);
            if (!allowedTypes.includes(fileType)) {
                Logger.error('File type not allowed');
                resolve(null);
                return;
            }
            resolve(file);
        };
        input.click();
    });
};

export async function getFileStringContent(
    file: FileReference | PopulatedFileReference, 
    fileContent?: string | Blob
): Promise<string> {
    // Handle media files with transcripts
    if ([FileType.IMAGE, FileType.AUDIO, FileType.VIDEO].includes(file.type)) {
        if (file.transcript?.content) {
            return file.transcript.content;
        }
        return `[${file.type} file: ${file.filename}]`;
    }

    // Handle text-based files
    if (file.type === FileType.FILE) {
        if (!fileContent) {
            // If we don't have the content but have content in transcript, use that
            if (file.transcript?.content) {
                return file.transcript.content;
            }
            return `[file: ${file.filename}]`;
        }

        try {
            const mimeType = getMimeType(file.filename);
            
            // Handle text-based formats including TypeScript files
            if (mimeType.startsWith('text/') || 
                mimeType === 'application/json' || 
                mimeType === 'application/xml' ||
                mimeType === 'application/javascript' ||
                file.filename.endsWith('.ts') ||
                file.filename.endsWith('.tsx')) {
                
                if (fileContent instanceof Blob) {
                    return await fileContent.text();
                } 
                
                if (typeof fileContent === 'string') {
                    // Handle base64 encoded content
                    if (fileContent.startsWith('data:')) {
                        const base64Content = fileContent.split(',')[1];
                        return atob(base64Content);
                    }
                    // Plain text content
                    return fileContent;
                }
            }

            // Handle other file types...
            return `[File: ${file.filename}]`;
        } catch (error) {
            Logger.error('Error reading file content:', error);
            return `[Error reading file: ${file.filename}]`;
        }
    }

    return `[Unknown file type: ${file.filename}]`;
}

// Helper function to extract text content from base64
export function getTextFromBase64(base64Content: string): string {
    try {
        const decoded = atob(base64Content.split(',')[1]);
        return decoded;
    } catch (error) {
        Logger.error('Error decoding base64 content:', error);
        return '[Error decoding file content]';
    }
}

export function getFileDescription(file: FileReference): string {
    const sizeInMB = getFileSize(file.file_size)
    return `${file.filename} (${sizeInMB.formatted})`;
}

interface FileSizeInfo {
    value: number;        // The converted size value
    unit: string;        // The unit (B, KB, MB, etc.)
    bytes: number;       // Original size in bytes
    raw: number;         // Original number provided
    formatted: string;   // Pre-formatted string (e.g., "1.21 MB")
}

export const bytesToMB = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb.toPrecision(3) + ' MB';
};

export function getFileSize(bytes: number): FileSizeInfo {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = Math.abs(bytes);
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    // For bytes, show no decimal places
    const value = unitIndex === 0 ? Math.round(size) : Number(size.toFixed(2));
    
    return {
        value,
        unit: units[unitIndex],
        bytes: Math.abs(bytes),
        raw: bytes,
        formatted: `${value} ${units[unitIndex]}`
    };
}