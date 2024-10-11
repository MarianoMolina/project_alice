import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, LoginResponse, initializeUserDatabase } from '../services/authService';
import { User } from '../types/UserTypes';
import Logger from '../utils/Logger';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAndNavigate: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
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

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const saveUserData = (userData: LoginResponse) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData.user));
      localStorage.setItem('token', userData.token);
      setUser(userData.user);
      setIsAuthenticated(true);
    } catch (error) {
      Logger.error('Error saving user data:', error);
    }
  };

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
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, loginAndNavigate, register, logout, getToken }}>
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