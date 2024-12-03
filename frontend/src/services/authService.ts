import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import axios from 'axios';
import { User } from '../types/UserTypes';
import Logger from '../utils/Logger';

export interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    Logger.debug('Logging in with email:', email);
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

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  try {
    const response = await dbAxiosInstance.post<User>('/users/register', { name, email, password });
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