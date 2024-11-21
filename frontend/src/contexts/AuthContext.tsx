import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, LoginResponse, initializeUserDatabase } from '../services/authService';
import { User } from '../types/UserTypes';
import Logger from '../utils/Logger';
import { fetchItem, updateItem } from '../services/api';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  refreshUserData: () => Promise<void>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAndNavigate: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      Logger.debug('token:', localStorage.getItem('token'));
      if (savedUser) {
        if (savedUser === 'null') Logger.warn('savedUser is null');
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      Logger.error('Failed to parse user data from localStorage:', error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  const saveUserData = useCallback((userData: LoginResponse | User) => {
    try {
      const userToSave = 'user' in userData ? userData.user : userData;
      const token = 'token' in userData ? userData.token : getToken();

      localStorage.setItem('user', JSON.stringify(userToSave));
      if (token) localStorage.setItem('token', token);
      
      setUser(userToSave);
      setIsAuthenticated(true);
    } catch (error) {
      Logger.error('Error saving user data:', error);
    }
  }, [getToken]);

  const refreshUserData = useCallback(async () => {
    try {
      if (!user?._id) throw new Error('No user ID found');
      const refreshedUser = await fetchItem('users', user._id) as User;
      saveUserData(refreshedUser);
    } catch (error) {
      Logger.error('Error refreshing user data:', error);
      throw error;
    }
  }, [user?._id, saveUserData]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      if (!user?._id) throw new Error('No user ID found');
      const updatedUser = await updateItem('users', user._id, userData);
      Logger.debug('Updated user:', updatedUser);
      saveUserData(updatedUser);
    } catch (error) {
      Logger.error('Error updating user:', error);
      throw error;
    }
  }, [user?._id, saveUserData]);

  const login = async (email: string, password: string) => {
    try {
      const userData = await loginUser(email, password);
      saveUserData(userData);
    } catch (error) {
      Logger.error('Login failed:', error);
      throw error;
    }
  };

  const loginAndNavigate = async (email: string, password: string) => {
    try {
      await login(email, password)
      navigate('/chat-alice');
    } catch (error) {
      Logger.error('Login failed:', error);
      throw error;
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      await registerUser(name, email, password);
      await login(email, password);
      await initializeUserDatabase();
    } catch (error) {
      Logger.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, loginAndNavigate, register, logout, getToken, updateUser, refreshUserData  }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};