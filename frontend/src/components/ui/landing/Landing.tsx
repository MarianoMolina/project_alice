import React from 'react';
import { Container, Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { WavyBackground } from '../aceternity/WavyBackground';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <WavyBackground>
      <Container component="main" sx={{ mt: 8, mb: 2 }} maxWidth="sm">
        <Typography variant="h2" component="h1" gutterBottom align='center'>
          Welcome
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align='center'>
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
      </Container>
    </WavyBackground>
  );
};

export default Landing;
