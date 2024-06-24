import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginUser, register as registerUser } from '../services/authService';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  loading: boolean;
  login: (token: string, user: { id: string; email: string }) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (token: string, user: { id: string; email: string }) => {
    try {
      const userData = JSON.stringify(user);
      console.log('Saving user data:', userData);
      localStorage.setItem('user', userData);
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      navigate('/');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await registerUser(name, email, password);
      const { token, user } = await loginUser(email, password);
      login(token, user);
    } catch (error) {
      console.error('Registration failed:', error);
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
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, logout }}>
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
