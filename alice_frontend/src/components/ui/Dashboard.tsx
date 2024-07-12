import React from 'react';
import { Container, Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';

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
          startIcon={<AddIcon />}
        >
          Execute Task
        </Button>
        <Button
          variant="contained"
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => handleNavigation('/chat-alice')}
          startIcon={<ChatIcon />}
        >
          Chat with Alice
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => handleNavigation('/configure')}
          startIcon={<SettingsIcon />}
        >
          Configure Alice Tools
        </Button>
      </Box>
    </Container>
  );
};

export default Dashboard;
