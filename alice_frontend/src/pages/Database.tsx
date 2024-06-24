import React, { useState } from 'react';
import { Container, Box, Button } from '@mui/material';
import ListPage from '../components/ListPage';

const collections = ['Tasks', 'Agents', 'Models', 'Users', 'Collections', 'Prompts', 'TaskResults'];

const Database: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState('Tasks');

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2}}>
        {collections.map((collection) => (
          <Button
            key={collection}
            variant={selectedCollection === collection ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setSelectedCollection(collection)}
            sx={{ mx: 1 }}
          >
            {collection}
          </Button>
        ))}
      </Box>
      <ListPage collectionName={selectedCollection} />
    </Container>
  );
};

export default Database;
