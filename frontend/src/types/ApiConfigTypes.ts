import { BaseDatabaseObject, convertToBaseDatabaseObject, EnhancedComponentProps } from './CollectionTypes';
import { ApiName } from './ApiTypes';

export enum HealthStatus {
    HEALTHY = 'healthy',
    UNHEALTHY = 'unhealthy',
    UNKNOWN = 'unknown'
}

export interface APIConfig extends BaseDatabaseObject {
    name: string;
    api_name: ApiName;
    data: { [key: string]: any };
    health_status: HealthStatus;
}

export const convertToAPIConfig = (data: any): APIConfig => {
    return {
        ...convertToBaseDatabaseObject(data),
        name: data?.name || '',
        api_name: data?.api_name || '',
        data: data?.data || {},
        health_status: data?.health_status || HealthStatus.UNKNOWN,
    };
};

export interface APIConfigComponentProps extends EnhancedComponentProps<APIConfig> {
    
}
export const getDefaultAPIConfigForm = (): Partial<APIConfig> => ({
    name: '',
    api_name: ApiName.LM_STUDIO,
    data: {},
    health_status: HealthStatus.HEALTHY
});