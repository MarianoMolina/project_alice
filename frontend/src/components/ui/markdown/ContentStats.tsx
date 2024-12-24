import React, { ReactNode } from 'react';
import { Box, Chip } from '@mui/material';
import { Timer, TextFields } from '@mui/icons-material';
import { CHAR_TO_TOKEN } from '../../../utils/Constants';

interface ContentStatsProps {
  content: string;
  children?: ReactNode;
}

const ContentStats: React.FC<ContentStatsProps> = ({ content, children }) => {
  const charCount = content.length;
  const tokenCount = Math.round(charCount / CHAR_TO_TOKEN);

  return (
    <Box className="flex items-center gap-2 mb-1 mt-1">
      {children}
      <Chip
        icon={<Timer className="text-gray-600" />}
        label={`~${tokenCount} tokens`}
        size="small"
        className="bg-gray-100"
      />
      <Chip
        icon={<TextFields className="text-gray-600" />}
        label={`${charCount} characters`}
        size="small"
        className="bg-gray-100"
      />
    </Box>
  );
};

export default ContentStats;