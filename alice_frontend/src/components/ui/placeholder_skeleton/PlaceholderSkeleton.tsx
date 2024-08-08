import React from 'react';
import { Stack, Typography, Skeleton } from '@mui/material';

type SkeletonMode = 'default' | 'compact' | 'chat' | 'task';

interface PlaceholderSkeletonProps {
  mode: SkeletonMode;
  text: string;
  className?: string;
}

const PlaceholderSkeleton: React.FC<PlaceholderSkeletonProps> = ({ mode, text, className }) => {
  const renderDefault = () => (
    <Stack spacing={1} className={className}>
      <Typography variant="h6" align="center" gutterBottom>{text}</Typography>
      {[...Array(6)].map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={40} />
      ))}
    </Stack>
  );

  const renderCompact = () => (
    <Stack spacing={1} className={className}>
        <Typography variant="h6" align="center" gutterBottom>{text}</Typography>
      {[...Array(3)].map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={30}/>
      ))}
    </Stack>
  );

  const renderChat = () => (
    <Stack spacing={1} className={className}>
      <Typography variant="h6" align="center" gutterBottom>{text}</Typography>
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton variant="rectangular" height={80} />
      <Skeleton variant="circular" width={40} height={40} style={{ alignSelf: 'flex-end' }} />
      <Skeleton variant="rounded" height={90} />
    </Stack>
  );

  const renderTask = () => (
    <Stack spacing={2} className={className}>
      <Typography variant="h6" align="center" gutterBottom>{text}</Typography>
      {[...Array(4)].map((_, index) => (
        <Skeleton key={index} variant="rectangular" height={60} />
      ))}
    </Stack>
  );

  switch (mode) {
    case 'default':
      return renderDefault();
    case 'compact':
      return renderCompact();
    case 'chat':
      return renderChat();
    case 'task':
      return renderTask();
    default:
      return null;
  }
};

export default PlaceholderSkeleton;