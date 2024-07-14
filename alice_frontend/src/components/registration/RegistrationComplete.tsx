import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface RegistrationCompleteProps {
  onComplete: () => void;
}

const RegistrationComplete: React.FC<RegistrationCompleteProps> = ({ onComplete }) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Registration Complete!
      </Typography>
      <Typography variant="body1" paragraph>
        Thank you for setting up your account with Alice. You're now ready to start using the platform.
      </Typography>
      <Button variant="contained" onClick={onComplete}>
        Continue to Alice Chat
      </Button>
    </Box>
  );
};

export default RegistrationComplete;