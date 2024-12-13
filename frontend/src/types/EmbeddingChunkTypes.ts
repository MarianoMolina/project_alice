import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from "./CollectionTypes";

export interface EmbeddingChunk extends BaseDatabaseObject {
    vector: number[];
    text_content: string;
    index: number;
    creation_metadata: { [key: string]: any };
}

export const convertToEmbeddingChunk = (data: any): EmbeddingChunk => {
    return {
        ...convertToBaseDatabaseObject(data),
        vector: data?.vector || [],
        text_content: data?.text_content || '',
        index: data?.index || 0,
        creation_metadata: data?.creation_metadata || {},
    };
};


export interface EmbeddingChunkComponentProps extends EnhancedComponentProps<EmbeddingChunk> {

}

export const getDefaultEmbeddingChunkForm = (): Partial<EmbeddingChunk> => ({
    vector: [],
    text_content: '',
    index: 0,
    creation_metadata: {}
});