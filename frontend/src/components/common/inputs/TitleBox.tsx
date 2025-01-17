import { ReactNode } from 'react';
import { Typography, SxProps, Theme } from '@mui/material';
import theme from '../../../Theme';
import BorderedContainer from './BorderContainer';

interface TitleBoxProps {
  title: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

const TitleBox = ({ title, children, sx }: TitleBoxProps) => {
  return (
    <BorderedContainer
      sx={{
        m: 1, // Preserve the original margin from TitleBox
        py: 3,
        px: 1,
        ...sx
      }}
    >
      <Typography
        variant="body1"
        sx={{
          position: 'absolute',
          top: -12,
          left: 16,
          px: 1,
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.text.primary
        }}
      >
        {title}
      </Typography>
      {children}
    </BorderedContainer>
  );
};

export default TitleBox;