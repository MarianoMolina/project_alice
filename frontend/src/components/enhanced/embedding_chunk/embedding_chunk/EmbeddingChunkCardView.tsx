import React from 'react';
import {
    Typography,
} from '@mui/material';
import { Language, QueryBuilder } from '@mui/icons-material';
import { EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import CommonCardView from '../../common/enhanced_component/CardView';

const EmbeddingChunkCardView: React.FC<EmbeddingChunkComponentProps> = ({
    item
}) => {

    if (!item) {
        return <Typography>No User Interaction data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Language />,
            primary_text: "Content",
            secondary_text: item.text_content || 'No content available'
        },
        {
            icon: <Language />,
            primary_text: "Index",
            secondary_text: item.index || 'No index available'
        },
        {
            icon: <Language />,
            primary_text: "Vector",
            secondary_text: item.vector || 'No vector available'
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='User Interaction'
            title={'User Interaction Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='embeddingchunks'
        >
        </CommonCardView>
    );
};

export default EmbeddingChunkCardView;