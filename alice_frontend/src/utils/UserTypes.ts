export interface User {
    id?: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}

export const convertToUser = (data: any): User => {
    return {
        id: data?.id || undefined,
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || 'user',
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};