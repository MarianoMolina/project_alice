import React, { useState, useCallback } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { DialogProvider } from './contexts/DialogContext';
import HomePage from './pages/HomePage';
import ChatAlice from './pages/ChatAlice';
import MainLayout from './layouts/main_layout/MainLayout';
import CreateWorkflow from './pages/StartTask';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './layouts/ProtectedRoute';
import UserSettings from './pages/UserSettings';
import NavigationGuard from './components/ui/navigation_guard/NavigationGuard';
import ErrorBoundary from './layouts/ErrorBoundary';
import Knowledgebase from './pages/Knowledgebase';
import StructuresPage from './pages/Structures';
import ReferencesPage from './pages/ReferencesPage';
import RedirectIfAuthenticated from './layouts/RedirectLogged';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './Theme';
import './assets/fonts/fonts.css';

const App: React.FC = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleConfirmNavigation = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const handleSetHasUnsavedChanges = useCallback((value: boolean) => {
    setHasUnsavedChanges(value);
  }, []);

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <DialogProvider>
              <CssBaseline />
              <NavigationGuard
                hasUnsavedChanges={hasUnsavedChanges}
                onConfirmNavigation={handleConfirmNavigation}
              >
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/login"
                      element={
                        <RedirectIfAuthenticated
                          element={<Login />}
                          redirectTo="/"
                        />
                      }
                    />
                    <Route
                      path="/register"
                      element={
                        <RedirectIfAuthenticated
                          element={
                            <Register />
                          }
                          redirectTo="/"
                        />
                      }
                    />
                    <Route path="/chat-alice" element={<ProtectedRoute element={<ChatAlice />} />} />
                    <Route path="/start-task" element={<ProtectedRoute element={<CreateWorkflow />} />} />
                    <Route path="/structures" element={<ProtectedRoute element={<StructuresPage />} />} />
                    <Route path="/references" element={<ProtectedRoute element={<ReferencesPage />} />} />
                    <Route
                      path="/user-settings"
                      element={
                        <ProtectedRoute
                          element={<UserSettings setHasUnsavedChanges={handleSetHasUnsavedChanges} />}
                        />
                      }
                    />
                    <Route path="/shared/*" element={<Knowledgebase />} />
                  </Routes>
                </MainLayout>
              </NavigationGuard>
            </DialogProvider>
          </ThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;