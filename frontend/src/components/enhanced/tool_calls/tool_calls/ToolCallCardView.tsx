import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description, DataObject } from '@mui/icons-material';
import { ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';

const ToolCallCardView: React.FC<ToolCallComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No ToolCall data available.</Typography>;
    }

    const embeddingChunkViewer = item.embedding && item.embedding?.length > 0 ?
     item.embedding.map((chunk, index) => (
        <EmbeddingChunkViewer
            key={chunk._id || `embedding-${index}`}
            item={chunk}
            items={null} onChange={()=>null} mode={'view'} handleSave={async()=>{}}
        />
    )) : <Typography>No embeddings available</Typography>;
    const listItems = [
        {
            icon: <Description />,
            primary_text: "Tool called",
            secondary_text: formatCamelCaseString(item.function?.name)
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Args",
            secondary_text: <CodeBlock language='json' code={JSON.stringify(item.function?.arguments, null, 2)} />
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
        },
        {
            icon: <Category />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        }
    ];
    const function_name = item.function?.name;
    const title = function_name ? `Tool Call: ${function_name}` : 'Tool Call';
    
    return (
        <CommonCardView
            elementType='Tool Call'
            title={title}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='toolcalls'
        />
    );
};

export default ToolCallCardView;