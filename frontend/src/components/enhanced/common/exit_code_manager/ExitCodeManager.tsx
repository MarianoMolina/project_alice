import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ExitCode {
  code: number;
  message: string;
}

interface ExitCodeManagerProps {
  exitCodes: { [key: string]: string };
  onChange: (newExitCodes: { [key: string]: string }) => void;
  isEditMode: boolean;
}

const ExitCodeManager: React.FC<ExitCodeManagerProps> = ({
  exitCodes,
  onChange,
  isEditMode,
}) => {
  const [codes, setCodes] = useState<ExitCode[]>([]);

  useEffect(() => {
    const initialCodes = Object.entries(exitCodes).map(([code, message]) => ({
      code: parseInt(code),
      message,
    }));
    setCodes(initialCodes);
  }, [exitCodes]);

  const handleAddCode = () => {
    const newCode = codes.length > 0 ? Math.max(...codes.map(c => c.code)) + 1 : 2;
    setCodes([...codes, { code: newCode, message: '' }]);
  };

  const handleRemoveCode = (index: number) => {
    const newCodes = codes.filter((_, i) => i !== index);
    setCodes(newCodes);
    updateParent(newCodes);
  };

  const handleCodeChange = (index: number, field: 'code' | 'message', value: string) => {
    const newCodes = [...codes];
    if (field === 'code') {
      newCodes[index].code = parseInt(value) || 0;
    } else {
      newCodes[index].message = value.slice(0, 300); // Limit message to 300 characters
    }
    setCodes(newCodes);
    updateParent(newCodes);
  };

  const updateParent = (newCodes: ExitCode[]) => {
    const newExitCodes = newCodes.reduce((acc, { code, message }) => {
      acc[code] = message;
      return acc;
    }, {} as { [key: string]: string });
    onChange(newExitCodes);
  };

  return (
    <Box>
      {codes.map((exitCode, index) => (
        <Box key={index} display="flex" alignItems="center" mb={1}>
          <TextField
            label="Code"
            type="number"
            value={exitCode.code}
            onChange={(e) => handleCodeChange(index, 'code', e.target.value)}
            disabled={index < 2 || !isEditMode}
            size="small"
            style={{ width: '80px', marginRight: '8px' }}
          />
          <TextField
            label="Message"
            value={exitCode.message}
            onChange={(e) => handleCodeChange(index, 'message', e.target.value)}
            disabled={!isEditMode}
            size="small"
            fullWidth
            inputProps={{ maxLength: 300 }}
          />
          {index >= 2 && isEditMode && (
            <IconButton onClick={() => handleRemoveCode(index)} size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      {isEditMode && (
        <Button onClick={handleAddCode} variant="outlined" size="small">
          Add Exit Code
        </Button>
      )}
    </Box>
  );
};

export default ExitCodeManager;