import axios from 'axios';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TextField, Button, Container, Typography, Box, Alert, Link } from '@mui/material';
import Logger from '../utils/Logger';
import GoogleOAuthButton from '../components/ui/registration/GoogleOauth';
import { GOOGLE_CLIENT_ID } from '../utils/Constants';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginAndNavigate, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await loginAndNavigate(email, password);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        Logger.error('Login failed:', error.response?.data);
        setError('Login failed. Please check your credentials and try again.');
      } else {
        Logger.error('Unexpected error:', error);
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };
  const handleGoogleSuccess = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
    } catch (error) {
      Logger.error('Google OAuth failed:', error);
      setError('Google login failed. Please try again later.');
    }
  };
  return (
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
        {GOOGLE_CLIENT_ID && (
          <Box className="my-4">
            <Typography variant="body2" align="center" className="mb-2">
              Or
            </Typography>
            <GoogleOAuthButton
              onSuccess={handleGoogleSuccess}
            />
          </Box>
        )}
        <Typography variant="body2" align="center">
          Don't have an account?{' '}
          <Link href="/register" underline="hover">
            Register
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
