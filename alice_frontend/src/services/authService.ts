import { dbAxiosInstance } from './axiosInstance';
import axios from 'axios';
import { User } from '../utils/Types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  console.log('Attempting to log in with:', { email, password });
  try {
    const response = await dbAxiosInstance.post<LoginResponse>('/users/login', { email, password });
    console.log('Login response:', response.data);
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
    console.log('Registration response:', response.data);
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