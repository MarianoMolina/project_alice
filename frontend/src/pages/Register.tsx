import React, { useCallback, useEffect, useState } from 'react';
import { Container, Typography, Box, Stepper, Step, StepLabel, StepContent, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ApiSetup from '../components/ui/registration/ApiSetup';
import RegistrationComplete from '../components/ui/registration/RegistrationComplete';
import useStyles from '../styles/RegisterStyles';
import Logger from '../utils/Logger';
import { useDialog } from '../contexts/DialogContext';
import { useApi } from '../contexts/ApiContext';
import { APIConfig } from '../types/ApiConfigTypes';
import InitializingDatabase from '../components/ui/registration/InitializingDataBase';
import CreateAccount from '../components/ui/registration/CreateAccount';

const Register = () => {
  const { register, setNeedsOnboarding, isAuthenticated, initializingDatabase, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [userApis, setUserApis] = useState<APIConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const classes = useStyles();
  const { selectFlexibleItem, selectedFlexibleItem } = useDialog();
  const { fetchItem } = useApi();

  const updateAPIs = useCallback(async () => {
    setIsLoading(true);
    const apis = await fetchItem('apiconfigs');
    setUserApis(apis as APIConfig[]);
    setIsLoading(false);
  }, [fetchItem]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedFlexibleItem && step !== 0) await updateAPIs();
    };
    fetchData();
  }, [selectedFlexibleItem, step, updateAPIs]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!needsOnboarding) navigate('/');
      if (step === 0) setStep(1);
    }
    if (!initializingDatabase && step === 1) {
      setStep(2);
    }
  }, [isAuthenticated, step, initializingDatabase, needsOnboarding, navigate]);

  const handleApiSelect = (api: APIConfig) => {
    if (!api._id) return;
    selectFlexibleItem('APIConfig', 'edit', api._id);
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await register(name, email, password);
      await updateAPIs();
      setStep(2);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiSetupComplete = async (bool: boolean) => {
    if (!bool) return;
    setStep(3);
  };

  const handleComplete = async () => {
    try {
      setNeedsOnboarding(false);
      Logger.info('Completing registration...');
      navigate('/chat-alice');
    } catch (error) {
      Logger.error('Failed to complete registration:', error);
      // Handle the error appropriately without setting error state
    }
  };

  const steps = [
    {
      label: 'Create Account',
      content: <CreateAccount onSubmit={handleRegister} />,
    },
    {
      label: 'Initializing your database',
      content: <InitializingDatabase />,
    },
    {
      label: 'Configure APIs',
      content: isLoading ? (
        <CircularProgress size={24} />
      ) : (
        <ApiSetup
          apis={userApis}
          onApiSelect={handleApiSelect}
          onComplete={handleApiSetupComplete}
        />
      ),
    },
    {
      label: 'Complete',
      content: isLoading ? (
        <CircularProgress size={24} />
      ) : (
        <RegistrationComplete onComplete={handleComplete} />
      ),
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
              <StepContent>{stepData.content}</StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Container>
  );
};

export default Register;