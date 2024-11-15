import { ApiType } from "./ApiTypes";
import { convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";

export interface ImageReference {
    url: string;
    alt?: string;
    caption?: string;
}

export interface ReferenceCategory {
    name: string;
    type?: string;
    description?: string;
}

export interface EntityConnection {
    entityId: string;
    relationshipType: string;
    metadata?: Record<string, any>;
}

export interface EntityReference extends Embeddable {
    source_id?: string;
    name?: string;
    description?: string;
    content?: string;
    url?: string;
    images: ImageReference[];
    categories: ReferenceCategory[];
    source?: ApiType;
    connections: EntityConnection[];
    metadata?: Record<string, any>;
}
export const convertToEntityReference = (data: any): EntityReference => {
    return {
        ...convertToEmbeddable(data),
        source_id: data?.source_id || '',
        name: data?.name || '',
        description: data?.description || '',
        content: data?.content || '',
        url: data?.url || '',
        images: data?.images || [],
        categories: data?.categories || [],
        source: data?.source || undefined,
        connections: data?.connections || [],
        metadata: data?.metadata || {},
    };
};

export interface EntityReferenceComponentProps extends EnhancedComponentProps<EntityReference> {
    
}

export const getDefaultEntityReferenceForm = (): Partial<EntityReference> => ({
    source_id: '',
    name: '',
    description: '',
    content: '',
    url: '',
    images: [],
    categories: [],
    source: undefined,
    connections: [],
    metadata: {}
});