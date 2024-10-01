import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';
import { ApiProvider } from '../contexts/ApiContext';
import { TaskProvider } from '../contexts/TaskContext';
import { ChatProvider } from '../contexts/ChatContext';
import { DialogProvider } from '../contexts/CardDialogContext';
import EnhancedCardDialog from '../components/enhanced/common/enhanced_card_dialog/EnhancedCardDialog';

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
    <DialogProvider>
      <ApiProvider>
        <TaskProvider>
          <ChatProvider>
            <EnhancedCardDialog />
            {element}
          </ChatProvider>
        </TaskProvider>
      </ApiProvider>
    </DialogProvider>
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

export default ProtectedRoute;
