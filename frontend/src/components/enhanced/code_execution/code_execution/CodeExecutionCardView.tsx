import React from 'react';
import { Typography } from '@mui/material';
import { Category, TypeSpecimen, Description, QueryBuilder, DataObjectRounded } from '@mui/icons-material';
import { CodeExecutionComponentProps, PopulatedCodeExecution } from '../../../../types/CodeExecutionTypes';
import CommonCardView from '../../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import ContentStats from '../../../ui/markdown/ContentStats';

const CodeExecutionCardView: React.FC<CodeExecutionComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No CodeExecution data available.</Typography>;
    }
    const populatedItem = item as PopulatedCodeExecution
    const embeddingChunkViewer = populatedItem.embedding && populatedItem.embedding?.length > 0 ?
        populatedItem.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                item={chunk}
                items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
        )) : <Typography>No embeddings available</Typography>;

    let listItems = [
        {
            icon: <Description />,
            primary_text: "Language",
            secondary_text: populatedItem.code_block.language
        },
        {
            icon: <TypeSpecimen />,
            primary_text: "Code",
            secondary_text: (
                <>
                    <ContentStats content={populatedItem.code_block.code} />
                    <CodeBlock language={populatedItem.code_block.language} code={populatedItem.code_block.code} />
                </>)
        },
    ];
    if (populatedItem.code_output && populatedItem.code_output.output) {
        listItems.push({
            icon: <TypeSpecimen />,
            primary_text: "Output",
            secondary_text: <CodeBlock language='bash' code={populatedItem.code_output.output} />
        });
        if (populatedItem.code_output.exit_code) {
            listItems.push({
                icon: <Category />,
                primary_text: "Exit Code",
                secondary_text: populatedItem.code_output.exit_code.toString()
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
            secondary_text: new Date(populatedItem.createdAt || '').toDateString()
        })

    return (
        <CommonCardView
            elementType='Code Execution'
            title="Code Execution"
            id={populatedItem._id}
            listItems={listItems}
            item={populatedItem}
            itemType='codeexecutions'
        />
    );
};

export default CodeExecutionCardView;