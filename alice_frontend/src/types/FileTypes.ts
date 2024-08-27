// FileTypes.ts

export enum FileType {
    TEXT = "text",
    IMAGE = "image",
    AUDIO = "audio",
    VIDEO = "video",
    FILE = "file",
}

export interface FileReference {
    _id: string;
    filename: string;
    type: FileType;
    file_size: number;
    storage_path: string;
    created_by: string;
    last_accessed?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface FileContentReference {
    _id?: string;
    filename: string;
    type: FileType;
    content: string; // base64 encoded content
    created_by?: string;
}

export interface ApiFileReference {
    _id: string;
    filename: string;
    type: FileType;
    file_size: number;
    storage_path: string;
    created_by: string;
    last_accessed?: string;
    createdAt: string;
    updatedAt: string;
}

export const convertToFileReference = (data: any): FileReference => {
    return {
        _id: data._id,
        filename: data.filename,
        type: data.type,
        file_size: data.file_size,
        storage_path: data.storage_path,
        created_by: data.created_by,
        last_accessed: data.last_accessed ? new Date(data.last_accessed) : undefined,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
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