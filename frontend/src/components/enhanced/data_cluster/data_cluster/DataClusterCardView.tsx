import React from 'react';
import {
    Typography,
    Box,
    Stack
} from '@mui/material';
import { Language, DataObject } from '@mui/icons-material';
import { DataClusterComponentProps } from '../../../../types/DataClusterTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import ReferenceChip from '../../common/references/ReferenceChip';

const DataClusterCardView: React.FC<DataClusterComponentProps> = ({
    item
}) => {
    if (!item) {
        return <Typography>No Data Cluster data available.</Typography>;
    }

    const renderEmbeddingChips = () => {
        if (!item.embeddings || item.embeddings.length === 0) {
            return <Typography color="text.secondary">No embedding chunks</Typography>;
        }

        return (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {item.embeddings.map((chunk, index) => (
                    <ReferenceChip
                        key={chunk._id}
                        reference={chunk}
                        type="EmbeddingChunk"
                        view={true}
                        className="reference-chip"
                    />
                ))}
            </Stack>
        );
    };

    const listItems = [
        {
            icon: <DataObject />,
            primary_text: "Embedding Chunks",
            secondary_text: <Box sx={{ mt: 1 }}>{renderEmbeddingChips()}</Box>
        },
        {
            icon: <Language />,
            primary_text: "Text Content",
            secondary_text: (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                        {item.embeddings?.map(chunk => chunk.text_content).join(' ') || 'No content available'}
                    </Typography>
                </Box>
            )
        }
    ];

    return (
        <CommonCardView
            elementType='Data Cluster'
            title={'Data Cluster Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='dataclusters'
        />
    );
};

export default DataClusterCardView;