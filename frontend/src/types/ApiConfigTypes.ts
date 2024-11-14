import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';
import { ApiName } from './ApiTypes';

export interface APIConfig extends BaseDatabaseObject {
    name: string;
    api_name: ApiName;
    data: Record<string, any>;
}

export const convertToAPIConfig = (data: any): APIConfig => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        api_name: data?.api_name || '',
        data: data?.data || {},
    };
};

export interface APIConfigComponentProps extends EnhancedComponentProps<APIConfig> {
    
}
export const getDefaultAPIConfigForm = (): Partial<APIConfig> => ({
    name: '',
    api_name: undefined,
    data: {}
});