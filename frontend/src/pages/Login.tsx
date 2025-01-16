import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Container } from '@mui/material';
import LoginCard from '../components/ui/registration/LoginCard';

const Login: React.FC = () => {
  const { loginAndNavigate, loginWithGoogle } = useAuth();

  const handleSubmit = async ({ email, password }: { email: string; password: string }) => {
    await loginAndNavigate(email, password);
  };

  return (
    <Container maxWidth="xs">
      <LoginCard
        cardType="login"
        onSubmit={handleSubmit}
        onGoogleSuccess={loginWithGoogle}
        showTitle
      />
    </Container>
  );
};

export default Login;
