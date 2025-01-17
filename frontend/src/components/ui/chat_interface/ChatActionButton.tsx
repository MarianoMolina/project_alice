import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { RoleType } from '../../../types/MessageTypes';

interface ActionButtonProps {
  isGenerating: boolean;
  role?: RoleType;
  generateResponse?: () => void;
  handleRegenerateResponse?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  isGenerating,
  role,
  generateResponse,
  handleRegenerateResponse,
}) => {
  if (isGenerating) {
    return <Button disabled>Generating...</Button>;
  }

  if (role === 'user' && generateResponse) {
    return (
      <Tooltip title="Request a response from the assistant based on the last user message">
        <Button size="small" variant='outlined' color="primary" onClick={generateResponse}>
          Request
        </Button>
      </Tooltip>
    );
  }

  if (role === 'assistant' && handleRegenerateResponse) {
    return (
      <Tooltip title="Remove the last assistant reply and generate a new response">
        <Button size="small" variant='outlined' color="warning" onClick={handleRegenerateResponse}>
          Regenerate
        </Button>
      </Tooltip>
    );
  }

  return null;
};

export default ActionButton;