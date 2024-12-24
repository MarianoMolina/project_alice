import React, { useState } from 'react';
import { Box, IconButton, useMediaQuery } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import KnowledgebaseNavigation from '../components/ui/knowledgebase/KnowledgebaseNavigation';
import KnowledgebaseContent from '../components/ui/knowledgebase/KnowledgebaseContent';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import useStyles from '../styles/KnowledgebaseStyles';

const Knowledgebase: React.FC = () => {
    const classes = useStyles();
    const isMobile = useMediaQuery('(max-width:800px)');
    const [isNavOpen, setIsNavOpen] = useState(!isMobile);

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    return (
        <Box className={classes.root}>
            {isMobile && (
                <IconButton 
                    onClick={toggleNav}
                    className={`${classes.toggleButton} ${
                        isNavOpen ? classes.toggleButtonOpen : classes.toggleButtonClosed
                    }`}
                    size="small"

                >
                    {isNavOpen ? <ChevronLeftIcon color={'primary'} /> : <ChevronRightIcon color={'primary'}/>}
                </IconButton>
            )}
            
            <Box className={classes.contentWrapper}>
                <Box
                    className={`${classes.navigationWrapper} ${
                        isNavOpen ? classes.navigationOpen : classes.navigationClosed
                    }`}
                >
                    <KnowledgebaseNavigation />
                </Box>
                
                <Box className={classes.mainContent}>
                    <Routes>
                        <Route path="*" element={<KnowledgebaseContent />} />
                    </Routes>
                </Box>
            </Box>
        </Box>
    );
};

export default Knowledgebase;
