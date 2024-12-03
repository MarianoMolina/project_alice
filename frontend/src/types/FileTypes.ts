import { BaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";
import { MessageType } from "./MessageTypes";

export enum FileType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface FileReference extends BaseDatabaseObject, Embeddable {
    filename: string;
    type: FileType;
    file_size: number;
    transcript?: MessageType;
    storage_path?: string;
    last_accessed?: Date;
}

export interface FileContentReference {
    _id?: string;
    filename: string;
    type: FileType;
    content: string; // base64 encoded content
    file_size: number;
}

export const convertToFileReference = (data: any): FileReference => {
    return {
        ...convertToEmbeddable(data),
        filename: data.filename,
        type: data.type,
        file_size: data.file_size,
        transcript: data.transcript ? data.transcript : undefined,
        storage_path: data.storage_path ? data.storage_path.toString() : undefined,
        last_accessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
    };
};

export interface FileComponentProps extends EnhancedComponentProps<FileReference> {
    
}

export const getDefaultFileForm = (): Partial<FileReference> => ({
    filename: '',
    type: FileType.FILE,
    file_size: 0,
});