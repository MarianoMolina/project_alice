export interface User {
    _id?: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BaseDataseObject {
  created_by?: User;
  updated_by?: User;
  createdAt?: Date;
  updatedAt?: Date;
}

export const convertToUser = (data: any): User => {
    return {
        _id: data?._id || undefined,
        name: data?.name || '',
        email: data?.email || '',
        role: data?.role || 'user',
        createdAt: data?.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data?.updatedAt ? new Date(data.updatedAt) : undefined,
    };
};