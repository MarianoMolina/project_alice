import React from 'react';
import { Container, Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SettingsApplications, Storage, Chat, Task} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
      <Typography variant="h2" component="h1" gutterBottom align='center'>
        HOME
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => handleNavigation('/start-task')}
          startIcon={<Task />}
        >
          Execute Task
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => handleNavigation('/chat-alice')}
          startIcon={<Chat />}
        >
          Chat with Alice
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => handleNavigation('/database')}
          startIcon={<Storage />}
        >
          View Database
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => handleNavigation('/user-settings')}
          startIcon={<SettingsApplications />}
        >
          User Settings
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard;
