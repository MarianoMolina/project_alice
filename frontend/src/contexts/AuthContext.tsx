import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, LoginResponse, initializeUserDatabase, handleGoogleOAuth } from '../services/authService';
import { User } from '../types/UserTypes';
import Logger from '../utils/Logger';
import { fetchItem, updateItem } from '../services/api';

interface AuthContextProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  initializingDatabase: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (value: boolean) => void;
  user: User | null;
  refreshUserData: () => Promise<void>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAndNavigate: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  updateUser: (userData: Partial<User>) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [initializingDatabase, setInitializingDatabase] = useState<boolean>(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
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
        if (parsedUser.role === 'admin') setIsAdmin(true);
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

  const saveUserData = useCallback((userData: LoginResponse) => {
    try {
      const userToSave = userData.user
      const token = userData.token

      localStorage.setItem('user', JSON.stringify(userToSave));
      if (token) localStorage.setItem('token', token);

      setUser(userToSave);
      if (userToSave.role === 'admin') setIsAdmin(true);
      setIsAuthenticated(true);
    } catch (error) {
      Logger.error('Error saving user data:', error);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      if (!user?._id) throw new Error('No user ID found');
      const refreshedUser = await fetchItem('users', user._id) as User;
      const userData = {
        user: refreshedUser,
        token: getToken() ?? undefined
      }
      saveUserData(userData);
    } catch (error) {
      Logger.error('Error refreshing user data:', error);
      throw error;
    }
  }, [user?._id, saveUserData, getToken]);

  const updateUser = useCallback(async (user: Partial<User>) => {
    try {
      if (!user?._id) throw new Error('No user ID found');
      const updatedUser = await updateItem('users', user._id, user);
      Logger.debug('Updated user:', updatedUser);
      const userDataNew = {
        user: updatedUser,
        token: getToken() ?? undefined
      }
      saveUserData(userDataNew);
    } catch (error) {
      Logger.error('Error updating user:', error);
      throw error;
    }
  }, [saveUserData, getToken]);

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
  const setupNewUser = async (userData: LoginResponse) => {
    try {
      Logger.info('Setting up new user:', userData.user);
      saveUserData(userData);
      setNeedsOnboarding(true);
      setInitializingDatabase(true);
      navigate('/register');
      await initializeUserDatabase();
      setInitializingDatabase(false);
    } catch (error) {
      Logger.error('Error setting up new user:', error);
      throw error;
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const userData = await registerUser(name, email, password);
      if (userData) await setupNewUser(userData);
    } catch (error) {
      Logger.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    setIsAuthenticated(false);
    setInitializingDatabase(false);
    setNeedsOnboarding(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const userData = await handleGoogleOAuth(credential);
      if (userData.isNewUser) await setupNewUser(userData);
      else saveUserData(userData);
    } catch (error) {
      Logger.error('Google login failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, initializingDatabase, needsOnboarding, isAdmin,
      setNeedsOnboarding,
      user, loading, login, loginAndNavigate, register, logout,
      getToken, updateUser, refreshUserData, loginWithGoogle
    }}>
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