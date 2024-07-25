import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, Stepper, Step, StepLabel, StepContent } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiSetup from '../components/ui/registration/ApiSetup';
import RegistrationComplete from '../components/ui/registration/RegistrationComplete';
import { API } from '../utils/ApiTypes';
import { createItem, fetchItem } from '../services/api';
import useStyles from '../styles/RegisterStyles';
import { WavyBackground } from '../components/ui/aceternity/WavyBackground';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [userApis, setUserApis] = useState<API[]>([]);
  const classes = useStyles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await register(name, email, password);
      const apis = await fetchItem('apis');
      setUserApis(apis as API[]);
      setStep(1); // Move to API setup after successful registration
    } catch (error) {
      setError('Registration failed. Please check your details and try again.');
    }
  };

  const handleApiSetupComplete = async (apis: API[]) => {
    setStep(2); // Move to the final step
  };

  const handleComplete = async () => {
    try {
      console.log('Completing registration...');
      navigate('/chat-alice');
    } catch (error) {
      setError('Failed to complete registration. Please try again.');
    }
  };

  const steps = [
    {
      label: 'Create Account',
      content: (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            type="text"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Register
          </Button>
        </form>
      ),
    },
    {
      label: 'Configure APIs',
      content: <ApiSetup apis={userApis} onComplete={handleApiSetupComplete} />,
    },
    {
      label: 'Complete',
      content: <RegistrationComplete onComplete={handleComplete} />,
    },
  ];

  return (
    <Container maxWidth="sm" className={classes.registerContainer}>
      <Box mt={5}>
        <Typography variant="h4" component="h1" gutterBottom>
          Register
        </Typography>
        <Stepper activeStep={step} orientation="vertical">
          {steps.map((stepData, index) => (
            <Step key={index}>
              <StepLabel>{stepData.label}</StepLabel>
              <StepContent>
                {stepData.content}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Container>
  );
};

export default Register;