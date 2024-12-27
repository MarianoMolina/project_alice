import React, { useState, useCallback } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './Theme';
import HomePage from './pages/HomePage';
import ChatAlice from './pages/ChatAlice';
import MainLayout from './layouts/main_layout/MainLayout';
import CreateWorkflow from './pages/StartTask';
import Login from './pages/Login'; 
import Register from './pages/Register';
import ProtectedRoute from './layouts/ProtectedRoute';
import UserSettings from './pages/UserSettings';
import NavigationGuard from './components/ui/navigation_guard/NavigationGuard';
import { AuthProvider } from './contexts/AuthContext';
import './assets/fonts/fonts.css';
import ErrorBoundary from './layouts/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationComponent from './components/ui/notification/Notification';
import { DialogProvider } from './contexts/DialogCustomContext';
import { CardDialogProvider } from './contexts/CardDialogContext';
import DialogComponent from './components/ui/dialog/DialogCustom';
import Knowledgebase from './pages/Knowledgebase';
import StructuresPage from './pages/Structures';
import ReferencesPage from './pages/ReferencesPage';
import RedirectIfAuthenticated from './layouts/RedirectLogged';

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
        <DialogProvider>
          <NotificationComponent />
          <DialogComponent />
          <AuthProvider>
            <ThemeProvider theme={theme}>
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
                            <CardDialogProvider>
                              <Register />
                            </CardDialogProvider>
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
            </ThemeProvider>
          </AuthProvider>
        </DialogProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
};

export default App;