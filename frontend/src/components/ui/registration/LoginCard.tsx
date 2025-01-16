import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, Link, CircularProgress, Paper } from '@mui/material';
import { GOOGLE_CLIENT_ID } from '../../../utils/Constants';
import GoogleOAuthButton from './GoogleOauth';

type CardType = 'login' | 'register';

interface LoginCardProps {
  cardType: CardType;
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
  onGoogleSuccess?: (credential: string) => Promise<void>;
  showTitle?: boolean;
}

const LoginCard: React.FC<LoginCardProps> = ({ cardType, onSubmit, onGoogleSuccess, showTitle = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = cardType === 'login';
  const title = isLogin ? 'Login' : 'Register';
  const submitButtonText = isLogin ? 'Login' : 'Register';
  const alternateActionText = isLogin 
    ? "Don't have an account? Register" 
    : "Already have an account? Login";
  const alternateActionLink = isLogin ? '/register' : '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const submitData = isLogin 
        ? { email, password }
        : { name, email, password };
      await onSubmit(submitData);
    } catch (error) {
      setError(isLogin 
        ? 'Login failed. Please check your credentials and try again.'
        : 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    if (!onGoogleSuccess) return;
    
    try {
      await onGoogleSuccess(credential);
    } catch (error) {
      setError('Google authentication failed. Please try again later.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper sx={{ p: 2, mt: 2 }}>
        {showTitle && (
            <Typography variant="h4" component="h1" gutterBottom>
                {title}
            </Typography>
        )}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField
              label="Name"
              type="text"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
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
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? <CircularProgress size={24} /> : submitButtonText}
          </Button>
        </form>

        {GOOGLE_CLIENT_ID && onGoogleSuccess && (
          <Box>
            <Typography variant="body2" align="center" sx={{ mb: 2}}>
              Or
            </Typography>
            <GoogleOAuthButton onSuccess={handleGoogleLogin} />
          </Box>
        )}

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          <Link href={alternateActionLink} underline="hover">
            {alternateActionText}
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default LoginCard;