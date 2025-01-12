import React from 'react';
import { Container } from '@mui/material';
import MarkdownDocument from '../components/ui/markdown/MarkdownDocument';

const TermsOfService: React.FC = () => {
  return (
    <Container sx={{ maxHeight: '100%'}}>
      <MarkdownDocument documentPath="/terms_of_service.md" />
    </Container>
  );
};

export default TermsOfService;