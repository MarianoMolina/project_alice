import React from 'react';
import {
    Typography,
} from '@mui/material';
import { Expand, FormatListNumbered, QueryBuilder, Tag, Toc } from '@mui/icons-material';
import { EmbeddingChunkComponentProps } from '../../../../types/EmbeddingChunkTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CopyButton } from '../../../ui/markdown/CopyButton';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const EmbeddingChunkCardView: React.FC<EmbeddingChunkComponentProps> = ({
    item
}) => {

    if (!item) { 
        return <Typography>No Embedding Chunk data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Toc />,
            primary_text: "Content",
            secondary_text: <AliceMarkdown children={item.text_content || 'No content available'} showCopyButton/>
        },
        {
            icon: <FormatListNumbered />,
            primary_text: "Index",
            secondary_text: item.index ? (item.index === 0 ? 0 : item.index) : 'No index available'
        },
        {
            icon: <Tag />,
            primary_text: "Vector",
            secondary_text: (item.vector && <CopyButton code={JSON.stringify(item.vector)} tooltip='Copy vector to clipboard'/>) || 'No vector available'
        },
        {
            icon: <Expand />,
            primary_text: "Content Length",
            secondary_text: (item.text_content && `Characters: ${item.text_content.length} - Tokens (est.): ${Math.round(item.text_content.length/3)}`) || 'No content length available'
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='Embedding Chunk'
            title={'Embedding Chunk'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='embeddingchunks'
        >
        </CommonCardView>
    );
};

export default EmbeddingChunkCardView;