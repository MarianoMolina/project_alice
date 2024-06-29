import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import ListPage from '../components/db_dashboard_old/ListPage';
import useStyles from '../styles/DatabaseStyles';

const collections = ['Tasks', 'Agents', 'Models', 'Users', 'Collections', 'Prompts', 'TaskResults'];

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
      <Box className={classes.listPageContainer}>
        <ListPage collectionName={selectedCollection} />
      </Box>
    </Box>
  );
};

export default Database;