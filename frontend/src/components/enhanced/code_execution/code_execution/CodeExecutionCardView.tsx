import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description, QueryBuilder, DataObjectRounded } from '@mui/icons-material';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import EmbeddingChunkViewer from '../../embedding_chunk/EmbeddingChunkViewer';

const CodeExecutionCardView: React.FC<CodeExecutionComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No CodeExecution data available.</Typography>;
    }
    const embeddingChunkViewer = item.embedding?.length > 0 ?
        item.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                chunk={chunk}
            />
        )) : <Typography>No embeddings available</Typography>;

    let listItems = [
        {
            icon: <Description />,
            primary_text: "Language",
            secondary_text: item.code_block.language
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Code",
            secondary_text: <CodeBlock language={item.code_block.language} code={item.code_block.code} />
        },
    ];
    if (item.code_output && item.code_output.output) {
        listItems.push({
            icon: <TypeSpecimen />,
            primary_text: "Output",
            secondary_text: <CodeBlock language='bash' code={item.code_output.output} />
        });
        if (item.code_output.exit_code) {
            listItems.push({
                icon: <Category />,
                primary_text: "Exit Code",
                secondary_text: item.code_output.exit_code.toString()
            });
        }
    }
    listItems.push(
        {
            icon: <DataObjectRounded />,
            primary_text: "Embedding",
            secondary_text: <>{embeddingChunkViewer}</>
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toDateString()
        })

    return (
        <CommonCardView
            elementType='Code Execution'
            title="Code Execution"
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='codeexecutions'
        />
    );
};

export default CodeExecutionCardView;