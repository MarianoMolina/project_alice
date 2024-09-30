import { MessageType } from "./MessageTypes";
import { BaseDataseObject, User } from "./UserTypes";

export enum FileType {
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface FileReference extends BaseDataseObject{
    _id: string;
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
        _id: data._id,
        filename: data.filename,
        type: data.type,
        file_size: data.file_size,
        transcript: data.transcript ? data.transcript : undefined,
        storage_path: data.storage_path ? data.storage_path.toString() : undefined,
        created_by: data.created_by ? data.created_by.toString() : undefined,
        last_accessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface FileComponentProps {
    items: FileReference[] | null;
    item: FileReference | null;
    onChange: (newItem: Partial<FileReference>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onInteraction?: (file: FileReference) => void;
    onView?: (file: FileReference) => void;
    showHeaders?: boolean;
}