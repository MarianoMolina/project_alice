import { BaseDatabaseObject, convertToBaseDatabaseObject, convertToEmbeddable, Embeddable, EnhancedComponentProps } from "./CollectionTypes";

export interface URLReference extends BaseDatabaseObject, Embeddable {
    title: string;
    url: string;
    content: string;
    metadata: { [key: string]: string };
}

export const convertToURLReference = (data: any): URLReference => {
    return {
        ...convertToBaseDatabaseObject(data),
        ...convertToEmbeddable(data),
        title: data?.title || '',
        url: data?.url || '',
        content: data?.content || '',
        metadata: data?.metadata || {},
    };
};

export interface URLReferenceComponentProps extends EnhancedComponentProps<URLReference> {
    
}

export const getDefaultURLReferenceForm = (): Partial<URLReference> => ({
    title: '',
    url: '',
    content: '',
    metadata: {}
});