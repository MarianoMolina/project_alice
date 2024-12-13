import React from 'react';
import { Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails, Tooltip } from '@mui/material';
import { PopulatedReferences } from '../../../types/ReferenceTypes';
import ReferencesViewer from '../data_cluster/ReferencesViewer';
import { useStyles } from '../data_cluster/ReferencesStyles';
import { ExpandMore } from '@mui/icons-material';
import { formatCamelCaseString } from '../../../utils/StyleUtils';

interface NodeReferencesViewerProps {
    references: PopulatedReferences;
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
            <Accordion className={classes.nodeContent}>
                <AccordionSummary expandIcon={<ExpandMore />} className={classes.nodeHeader}>
                    <Tooltip title={nodeName} arrow>
                        <Typography
                            variant={level === 0 ? "h6" : "subtitle1"}
                            sx={{
                                flexGrow: 1,
                                fontWeight: level === 0 ? 600 : 500,
                            }}
                        >
                            {`Node: ${formatCamelCaseString(nodeName)}`}
                        </Typography>
                    </Tooltip>
                    {/* {executionOrder !== undefined && (
                        <Chip
                            size="small"
                            label={`Order: ${executionOrder}`}
                            sx={{ mr: 1 }}
                        />
                    )} */}
                    {exitCode !== undefined && (
                        <Chip
                            size="small"
                            {...getExitCodeProps(exitCode)}
                            className={classes.exitCodeChip}
                        />
                    )}
                </AccordionSummary>
                <AccordionDetails sx={{ ml: 2 }}>
                    <ReferencesViewer references={references} />
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};