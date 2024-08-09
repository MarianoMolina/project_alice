import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { ApiProvider } from '../context/ApiContext';
import { TaskProvider } from '../context/TaskContext';
import { ChatProvider } from '../context/ChatContext';
import { DialogProvider } from '../context/DialogContext';

interface ProtectedRouteProps {
  element: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? (
    <ApiProvider>
      <TaskProvider>
        <ChatProvider>
          <DialogProvider>
            {element}
          </DialogProvider>
        </ChatProvider>
      </TaskProvider>
    </ApiProvider>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default ProtectedRoute;
