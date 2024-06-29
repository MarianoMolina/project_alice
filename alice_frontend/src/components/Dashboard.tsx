import React from 'react';
import { Container, Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import ChatIcon from '@mui/icons-material/Chat';

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
          sx={{ mb: 2 }}
          onClick={() => handleNavigation('/database')}
          startIcon={<StorageIcon />}
        >
          Database
        </Button>
        {/* <Button
          variant="contained"
          fullWidth
          onClick={() => handleNavigation('/alice-tools')}
          startIcon={<BuildIcon />}
        >
          Configure Alice Tools
        </Button> */}
      </Box>
    </Container>
  );
};

export default Dashboard;
