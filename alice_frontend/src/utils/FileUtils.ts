import { FileContentReference, FileType } from '../types/FileTypes';

export const FileTypeExtensionsMap: Record<FileType, string[]> = {
    [FileType.TEXT]: ['txt', 'md', 'csv', 'json'],
    [FileType.IMAGE]: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
    [FileType.AUDIO]: ['mp3', 'wav', 'ogg', 'flac'],
    [FileType.VIDEO]: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
    [FileType.FILE]: []
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
                case FileType.TEXT:
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
                console.error('File type not allowed');
                resolve(null);
                return;
            }
            resolve(file);
        };
        input.click();
    });
};