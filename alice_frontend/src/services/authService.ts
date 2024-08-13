import { dbAxiosInstance, taskAxiosInstance } from './axiosInstance';
import axios from 'axios';
import { User } from '../types/UserTypes';

export interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await dbAxiosInstance.post<LoginResponse>('/users/login', { email, password });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Login error:', error.response?.data);
    } else {
      console.error('Unexpected error:', error);
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
      console.error('Registration error:', error.response?.data);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const initializeUserDatabase = async (): Promise<void> => {
  try {
    const response = await taskAxiosInstance.post(`/initialize_user_database`);
    return;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Initialization error:', error.response?.data);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}