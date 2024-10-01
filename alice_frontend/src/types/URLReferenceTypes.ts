import { HandleClickProps } from "./CollectionTypes";
import { BaseDataseObject } from "./UserTypes";

export interface URLReference extends BaseDataseObject {
    _id?: string;
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
}

export const convertToURLReference = (data: any): URLReference => {
    return {
        _id: data?._id || undefined,
        title: data?.title || '',
        url: data?.url || '',
        content: data?.content || '',
        metadata: data?.metadata || {},
        created_by: data?.created_by || undefined,
        updated_by: data?.updated_by || undefined,
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};

export interface URLReferenceComponentProps extends HandleClickProps {
    items: URLReference[] | null;
    item: URLReference | null;
    onChange: (newItem: Partial<URLReference>) => void;
    mode: 'create' | 'view' | 'edit';
    handleSave: () => Promise<void>;
    isInteractable?: boolean;
    onView?: (urlReference: URLReference) => void;
    onInteraction?: (urlReference: URLReference) => void;
    showHeaders?: boolean;
}