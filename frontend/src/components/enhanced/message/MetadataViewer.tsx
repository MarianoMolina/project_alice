import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Stack,
    Box,
    Grid,
    Tooltip,
    Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { MessageCreationMetadata } from '../../../types/MessageTypes';
import { CodeBlock } from '../../ui/markdown/CodeBlock';
import { collectionElementIcons } from '../../../utils/CollectionUtils';

interface GenerationMetadataViewerProps {
    metadata?: MessageCreationMetadata & Record<string, any>;
    est_tokens?: number;
}

const GenerationMetadataViewer: React.FC<GenerationMetadataViewerProps> = ({ metadata, est_tokens }) => {
    if (!metadata) {
        return <Typography color="text.secondary">No metadata available</Typography>;
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
                {/* Model Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            fontWeight: 500,
                            color: 'primary.main'
                        }}
                    >
                        <collectionElementIcons.Model />
                        Model
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ pl: 3 }}
                    >
                        {metadata.model || 'N/A'}
                    </Typography>
                </Box>

                {/* Token and Cost Grid */}
                <Grid container spacing={2}>
                    {/* Headers */}
                    <Grid item xs={4}></Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Tokens
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Cost
                        </Typography>
                    </Grid>

                    {/* Input Row */}
                    <Grid item xs={4}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Input</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Tooltip
                            title={metadata.estimated_tokens ? `Est: ${Math.round(metadata.estimated_tokens).toLocaleString()}` : ''}
                            arrow
                        >
                            <Typography variant="body2" color="text.secondary">
                                {metadata.usage?.prompt_tokens?.toLocaleString() || 'N/A'}
                            </Typography>
                        </Tooltip>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                            ${metadata.cost?.input_cost?.toFixed(6) || 'N/A'}
                        </Typography>
                    </Grid>

                    {/* Completion Row */}
                    <Grid item xs={4}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Completion</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Tooltip title={est_tokens ? `Est: ${est_tokens.toLocaleString()}` : ''} arrow>
                            <Typography variant="body2" color="text.secondary">
                                {metadata.usage?.completion_tokens?.toLocaleString() || 'N/A'}
                            </Typography>
                        </Tooltip>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                            ${metadata.cost?.output_cost?.toFixed(6) || 'N/A'}
                        </Typography>
                    </Grid>

                    {/* Total Row */}
                    <Grid item xs={4}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Total</Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                            {metadata.usage?.total_tokens?.toLocaleString() || 'N/A'}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                            ${metadata.cost?.total_cost?.toFixed(6) || 'N/A'}
                        </Typography>
                    </Grid>
                </Grid>

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
                        <Typography variant="body2" color="text.secondary">Raw Metadata</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <CodeBlock
                            language="json"
                            code={JSON.stringify(metadata, null, 2)}
                        />
                    </AccordionDetails>
                </Accordion>
            </Stack>
        </Paper>
    );
};

export default GenerationMetadataViewer;