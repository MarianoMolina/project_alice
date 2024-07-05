import { Document } from 'mongoose';

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
}

export interface IUserDocument extends IUser, Document {
    createdAt: Date;
    updatedAt: Date;
    apiRepresentation: () => any;
}