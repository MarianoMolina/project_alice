import React from 'react';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import KnowledgebaseNavigation from '../components/ui/knowledgebase/KnowledgebaseNavigation';
import KnowledgebaseContent from '../components/ui/knowledgebase/KnowledgebaseContent';
import useStyles from '../styles/KnowledgebaseStyles';

const Knowledgebase: React.FC = () => {
    const classes = useStyles();
    return (
        <Box display="flex" height="100%">
            <KnowledgebaseNavigation />
            <Box flex={1} p={3} className={classes.knowledgebaseContentContainer}>
                <Routes>
                    <Route path="*" element={<KnowledgebaseContent />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default Knowledgebase;