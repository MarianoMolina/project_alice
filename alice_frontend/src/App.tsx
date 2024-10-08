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
import Database from './pages/Database';
import UserSettings from './pages/UserSettings';
import NavigationGuard from './components/ui/navigation_guard/NavigationGuard';
import { AuthProvider } from './contexts/AuthContext';
import './assets/fonts/fonts.css';
import { ApiProvider } from './contexts/ApiContext';
import ErrorBoundary from './layouts/ErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationComponent from './components/ui/notification/Notification';
import { DialogProvider } from './contexts/DialogCustomContext';
import { DialogProvider as CardDialogProvider } from './contexts/CardDialogContext';
import DialogComponent from './components/ui/dialog/DialogCustom';
import EnhancedCardDialog from './components/enhanced/common/enhanced_card_dialog/EnhancedCardDialog';
import EnhancedFlexibleDialog from './components/enhanced/common/enhanced_card_dialog/EnhancedFlexibleDialog';
import Knowledgebase from './pages/Knowledgbase';

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
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={
                      <CardDialogProvider>
                        <ApiProvider>
                          <EnhancedCardDialog />
                          <EnhancedFlexibleDialog />
                          <Register />
                        </ApiProvider>
                      </CardDialogProvider>
                    } />
                    <Route path="/chat-alice" element={<ProtectedRoute element={<ChatAlice />} />} />
                    <Route path="/start-task" element={<ProtectedRoute element={<CreateWorkflow />} />} />
                    <Route path="/database" element={<ProtectedRoute element={<Database />} />} />
                    <Route
                      path="/user-settings"
                      element={
                        <ProtectedRoute
                          element={<UserSettings setHasUnsavedChanges={handleSetHasUnsavedChanges} />}
                        />
                      }
                    />
                    <Route path="/knowledgebase/*" element={<Knowledgebase />} />
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