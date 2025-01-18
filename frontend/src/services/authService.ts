import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import axios from 'axios';
import { User } from '../types/UserTypes';
import Logger from '../utils/Logger';

export interface LoginResponse {
  user: User;
  token?: string;
  isNewUser?: boolean;
  message?: string;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    Logger.debug('Starting login request');
    Logger.debug('Request URL:', dbAxiosInstance.defaults.baseURL + '/users/login');
    Logger.debug('Request payload:', { email, password });
    const response = await dbAxiosInstance.post<LoginResponse>('/users/login', { email, password });
    Logger.debug('Login response:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      Logger.error('Login error:', error.response?.data);
    } else {
      Logger.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const registerUser = async (name: string, email: string, password: string): Promise<LoginResponse> => {
  try {
    Logger.debug('Registering and logging in user with email:', email);
    const response = await dbAxiosInstance.post<LoginResponse>('/users/register', { name, email, password });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      Logger.error('Registration error:', error.response?.data);
    } else {
      Logger.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const initializeUserDatabase = async (): Promise<String> => {
  try {
    const response = await taskAxiosInstance.post(`/initialize_user_database`);
    return response.data.message;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      Logger.error('Initialization error:', error.response?.data);
    } else {
      Logger.error('Unexpected error:', error);
    }
    throw error;
  }
}

export const handleGoogleOAuth = async (credential: string): Promise<LoginResponse> => {
  try {
    Logger.debug('Starting Google OAuth authentication');
    const response = await dbAxiosInstance.post<LoginResponse>('/users/oauth/google', { credential });
    Logger.debug('OAuth authentication response:', response.data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      Logger.error('OAuth authentication error:', error.response?.data);
    } else {
      Logger.error('Unexpected error:', error);
    }
    throw error;
  }
};