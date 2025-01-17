import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Stack,
    Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CodeBlock } from '../../ui/markdown/CodeBlock';
import { aggregateTaskMetadata, TaskUsageMetrics } from '../../../types/TaskResponseTypes';
import CreationMetadataViewer from '../../common/metadata_viewer/CreationMetadataViewer';

interface TaskResponseMetadataViewerProps {
    usageMetrics: TaskUsageMetrics;
    est_tokens?: number;
}

const TaskResponseMetadataViewer: React.FC<TaskResponseMetadataViewerProps> = ({
    usageMetrics
}) => {
    if (!usageMetrics || Object.keys(usageMetrics).length === 0) {
        return (
            <Paper sx={{ p: 2 }}>
                <Typography color="text.secondary">No metadata available</Typography>
            </Paper>
        );
    }

    const aggregatedMetadata = aggregateTaskMetadata(usageMetrics);

    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
                {/* Aggregated Summary View */}
                <CreationMetadataViewer
                    metadata={aggregatedMetadata}
                    est_tokens={aggregatedMetadata.estimated_tokens}
                />

                {/* Complete Task Metadata View */}
                <Accordion sx={{
                    bgcolor: 'background.paper',
                    '&:before': {
                        display: 'none',
                    },
                    boxShadow: 'none',
                    border: '1px solid',
                    borderColor: 'divider'
                }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            minHeight: '48px',
                            '& .MuiAccordionSummary-content': {
                                margin: '8px 0',
                            }
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">Complete Task Metadata</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>
                            {Object.entries(usageMetrics).map(([key, metadataList]) => (
                                metadataList && metadataList.length > 0 && (
                                    <Stack key={key} spacing={1}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Typography>
                                        <CodeBlock
                                            language="json"
                                            code={JSON.stringify(metadataList, null, 2)}
                                        />
                                    </Stack>
                                )
                            ))}
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Stack>
        </Paper>
    );
};

export default TaskResponseMetadataViewer;