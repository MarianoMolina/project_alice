// services/authService.ts
import { dbAxiosInstance } from './axiosInstance';
import axios from 'axios';

interface LoginResponse {
  token: string;
  user: { id: string; email: string }; // Correct the type here
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  console.log('Attempting to log in with:', { email, password });  // Add this log
  try {
    const response = await dbAxiosInstance.post('/users/login', { email, password });
    console.log('Login response:', response.data);  // Add this log
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Login error:', error.response?.data);  // Add this log
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};

export const register = async (name: string, email: string, password: string): Promise<void> => {
  await dbAxiosInstance.post('/users/register', { name, email, password });
};
