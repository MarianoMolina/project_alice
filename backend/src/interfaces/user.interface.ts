import { Document, Model } from 'mongoose';

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
}

export interface IUserMethods {
    apiRepresentation(): any;
}

export interface IUserDocument extends IUser, Document, IUserMethods {
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserModel extends Model<IUserDocument> {
    // Add any static methods here if needed
}