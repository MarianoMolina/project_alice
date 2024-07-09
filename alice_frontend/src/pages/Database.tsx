import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import useStyles from '../styles/DatabaseStyles';
import EnhancedChat from '../components/chat/chat/EnhancedChat';

const collections = ['Tasks', 'Agents', 'Models', 'Users', 'Collections', 'Prompts', 'TaskResponses', 'Parameters'];

const Database: React.FC = () => {
  const classes = useStyles();
  const [selectedCollection, setSelectedCollection] = useState('Tasks');

  return (
    <Box className={classes.container}>
      <Box className={classes.buttonGroup}>
        {collections.map((collection) => (
          <Button
            key={collection}
            variant={selectedCollection === collection ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => setSelectedCollection(collection)}
            className={classes.button}
          >
            {collection}
          </Button>
        ))}
      </Box>
      <EnhancedChat 
      mode="table" 
      fetchAll={true} 
      isInteractable={true}
      />
    </Box>
  );
};

export default Database;