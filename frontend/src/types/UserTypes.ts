import { BasicDBObj, convertToBasicDBObj } from "./CollectionTypes";

export interface User extends BasicDBObj {
    name: string;
    email: string;
    role?: 'user' | 'admin';
}

export const convertToUser = (data: any): User => {
    return {
        ...convertToBasicDBObj(data),
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || 'user',
    };
};