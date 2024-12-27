import React from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    Stack,
    Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CodeBlock } from '../../ui/markdown/CodeBlock';
import CreationMetadataViewer from '../common/metadata_viewer/CreationMetadataViewer';
import { MessageCreationMetadata } from '../../../types/CollectionTypes';

interface MessageMetadataViewerProps {
    metadata?: MessageCreationMetadata;
    est_tokens?: number;
}

const MessageMetadataViewer: React.FC<MessageMetadataViewerProps> = ({
    metadata,
    est_tokens
}) => {
    if (!metadata) {
        return <Typography color="text.secondary">No metadata available</Typography>;
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
                {/* Summary View */}
                <CreationMetadataViewer
                    metadata={metadata}
                    est_tokens={est_tokens}
                />

                {/* Raw Metadata View */}
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

export default MessageMetadataViewer;