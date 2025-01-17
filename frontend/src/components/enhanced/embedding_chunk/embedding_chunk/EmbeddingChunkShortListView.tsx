import React from 'react';
import { EmbeddingChunk, EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';

const EmbeddingChunkShortListView: React.FC<EmbeddingChunkComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.text_content.substring(0, 50);
    const getSecondaryText = (EmbeddingChunk: EmbeddingChunk) => EmbeddingChunk.index.toString();

    return (
        <EnhancedShortListView<EmbeddingChunk>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default EmbeddingChunkShortListView;