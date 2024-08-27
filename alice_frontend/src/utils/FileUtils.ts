import { FileContentReference, FileReference, FileType  } from '../types/FileTypes';

export const createFileContentReference = async (file: File): Promise<FileContentReference> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && event.target.result) {
                const base64Content = event.target.result.toString().split(',')[1];
                resolve({
                    filename: file.name,
                    type: inferFileType(file.name),
                    content: base64Content
                });
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const inferFileType = (filename: string): FileType => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'txt':
        case 'md':
        case 'csv':
            return FileType.TEXT;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
            return FileType.IMAGE;
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
            return FileType.AUDIO;
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'wmv':
        case 'webm':
            return FileType.VIDEO;
        default:
            return FileType.FILE;
    }
};

export const getFileContent = async (file: FileReference): Promise<string> => {
    try {
        console.log('Fetching file:', file.filename, 'from:', file.storage_path);
        const response = await fetch(file.storage_path);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        console.log('Blob type:', blob.type, 'size:', blob.size);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                console.log('FileReader result type:', typeof result);
                console.log('FileReader result preview:', result.substring(0, 100));
                resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error fetching file content:', error);
        throw new Error('Failed to fetch file content');
    }
};