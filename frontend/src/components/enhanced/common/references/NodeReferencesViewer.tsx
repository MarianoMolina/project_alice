import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { References } from '../../../../types/ReferenceTypes';
import ReferencesViewer from './ReferencesViewer';
import { useStyles } from './ReferencesStyles';

interface NodeReferencesViewerProps {
    references: References;
    level: number;
    nodeName: string;
    executionOrder?: number;
    exitCode?: number;
}

const getExitCodeProps = (exitCode: number) => {
    switch (exitCode) {
        case 0:
            return { label: 'Exit: 0', className: 'success' };
        case 1:
            return { label: 'Exit: 1', className: 'error' };
        default:
            return { label: `Exit: ${exitCode}`, className: 'warning' };
    }
};

export const NodeReferencesViewer: React.FC<NodeReferencesViewerProps> = ({
    references,
    level,
    nodeName,
    executionOrder,
    exitCode
}) => {
    const classes = useStyles();

    if (!references) return null;

    return (
        <Box className={classes.nodeContainer}>
            <Box className={classes.nodeContent}>
                <Box className={classes.nodeHeader}>
                    <Typography
                        variant={level === 0 ? "h6" : "subtitle1"}
                        sx={{
                            flexGrow: 1,
                            fontWeight: level === 0 ? 600 : 500,
                        }}
                    >
                        {nodeName}
                    </Typography>
                    {executionOrder !== undefined && (
                        <Chip
                            size="small"
                            label={`Order: ${executionOrder}`}
                            sx={{ mr: 1 }}
                        />
                    )}
                    {exitCode !== undefined && (
                        <Chip
                            size="small"
                            {...getExitCodeProps(exitCode)}
                            className={classes.exitCodeChip}
                        />
                    )}
                </Box>

                <Box sx={{ ml: 2 }}>
                    <ReferencesViewer references={references} />
                </Box>
            </Box>
        </Box>
    );
};