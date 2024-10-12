import React, { useCallback, useEffect, useState } from 'react';
import { TextField, Button, Container, Typography, Box, Alert, Stepper, Step, StepLabel, StepContent, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiSetup from '../components/ui/registration/ApiSetup';
import RegistrationComplete from '../components/ui/registration/RegistrationComplete';
import { API } from '../types/ApiTypes';
import { fetchItem } from '../services/api';
import useStyles from '../styles/RegisterStyles';
import Logger from '../utils/Logger';
import { useCardDialog } from '../contexts/CardDialogContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [userApis, setUserApis] = useState<API[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const classes = useStyles();
  const { selectFlexibleItem, selectedFlexibleItem } = useCardDialog();

  const updateAPIs = useCallback(async () => {
    setIsLoading(true);
    const apis = await fetchItem('apis');
    setUserApis(apis as API[]);
    setIsLoading(false);
  }, [fetchItem]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFlexibleItem && step !== 0) await updateAPIs();
    };
    fetchData();
  }, [selectedFlexibleItem, step, updateAPIs]);

  const handleApiSelect = (api: API) => {
    if (!api._id) return;
    selectFlexibleItem('API', 'edit', api._id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(name, email, password);
      await updateAPIs();
      setStep(1); // Move to API setup after successful registration
    } catch (error) {
      setError('Registration failed. Please check your details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiSetupComplete = async (bool: boolean) => {
    if (!bool) return
    setStep(2); 
  };

  const handleComplete = async () => {
    try {
      Logger.info('Completing registration...');
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
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </form>
      ),
    },
    {
      label: 'Configure APIs',
      content: isLoading ? <CircularProgress size={24} /> : <ApiSetup apis={userApis} onApiSelect={handleApiSelect} onComplete={handleApiSetupComplete} />,
    },
    {
      label: 'Complete',
      content: isLoading ? <CircularProgress size={24} /> : <RegistrationComplete onComplete={handleComplete} />,
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