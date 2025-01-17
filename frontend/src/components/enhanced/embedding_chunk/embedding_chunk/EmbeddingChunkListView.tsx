import React from 'react';
import { EmbeddingChunk, EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';

const EmbeddingChunkListView: React.FC<EmbeddingChunkComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.text_content.substring(0, 50);
    const getSecondaryText = (EmbeddingChunk: EmbeddingChunk) => (
        <Typography component="span" variant="body2" color="textSecondary">
            # {EmbeddingChunk.index.toString()} - {EmbeddingChunk.text_content.length} chars - {Math.round(EmbeddingChunk.text_content.length / 3)} tokens (est.)
        </Typography>
    );

    return (
        <EnhancedListView<EmbeddingChunk>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select User Interaction"
            viewTooltip="View User Interaction"
            collectionElementString='EmbeddingChunk'
        />
    );
};

export default EmbeddingChunkListView;