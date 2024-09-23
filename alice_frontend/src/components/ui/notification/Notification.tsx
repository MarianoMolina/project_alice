import React from 'react';
import { Alert, Snackbar, Button } from '@mui/material';
import { useNotification } from '../../../context/NotificationContext';

const NotificationComponent: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <>
      {notifications.map(({ id, message, type, action }) => (
        <Snackbar
          key={id}
          open={true}
          autoHideDuration={5000}
          onClose={() => removeNotification(id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => removeNotification(id)} 
            severity={type} 
            sx={{ width: '100%' }}
            action={
              action && (
                <Button color="inherit" size="small" onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            }
          >
            {message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationComponent;