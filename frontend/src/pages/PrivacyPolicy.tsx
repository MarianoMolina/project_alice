import React from 'react';
import { Container } from '@mui/material';
import MarkdownDocument from '../components/ui/markdown/MarkdownDocument';
const PrivacyPolicy: React.FC = () => {
  return (
    <Container sx={{ maxHeight: '100%'}}>
      <MarkdownDocument documentPath="/privacy_policy.md" />
    </Container>
  );
};

export default PrivacyPolicy;