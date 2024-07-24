import axios from 'axios';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Container, Typography, Box, Alert, Link } from '@mui/material';
import { WavyBackground } from '../components/ui/aceternity/WavyBackground';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginAndNavigate } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await loginAndNavigate(email, password);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Login failed:', error.response?.data);
        setError('Login failed. Please check your credentials and try again.');
      } else {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <WavyBackground>
      <Container maxWidth="xs">
        <Box mt={5}>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" style={{ marginBottom: '16px' }}>
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mb: 2 }}>
              Login
            </Button>
          </form>
          <Typography variant="body2" align="center">
            Don't have an account?{' '}
            <Link href="/register" underline="hover">
              Register
            </Link>
          </Typography>
        </Box>
      </Container>
    </WavyBackground>
  );
};

export default Login;
