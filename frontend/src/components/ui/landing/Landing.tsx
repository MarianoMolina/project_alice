import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { WavyBackground } from '../aceternity/WavyBackground';
import logo from '../../../assets/img/logo1024.png';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <WavyBackground>
      <Box component="main" sx={{ maxHeight: '100%', padding: '50px 0 100px 0', overflowY: 'auto' }}>
        <Typography variant="h2" component="h2" gutterBottom align='center'>
          Welcome
        </Typography>

        <Typography variant="h3" component="h3" gutterBottom align='center'>
          To Project Alice
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src={logo} alt="Project Alice Logo" style={{ maxWidth: '200px', height: 'auto' }} />
        </Box>

        <Typography variant="h4" component="h4" gutterBottom align='center'>
          The Agentic Workflows Manager
        </Typography>

        <Typography variant="h5" component="h5" gutterBottom align='center'>
          Please login or register to continue
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => handleNavigation('/login')}
          >
            Login
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handleNavigation('/register')}
          >
            Register
          </Button>
        </Box>
      </Box>
    </WavyBackground>
  );
};

export default Landing;