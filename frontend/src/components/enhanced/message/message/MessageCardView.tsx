import React from 'react';
import {
    Box,
    Chip,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import { Person, AttachFile, TextSnippet, Engineering, PersonPin, DataObject, QueryBuilder, TextFields, Timer } from '@mui/icons-material';
import { MessageComponentProps, PopulatedMessage } from '../../../../types/MessageTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';
import AliceMarkdown, { CustomBlockType } from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import ReferencesViewer from '../../data_cluster/ReferencesViewer';
import { getMessageTypeIcon } from '../../../../utils/MessageUtils';

const MessageCardView: React.FC<MessageComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No message data available.</Typography>;
    }
    const populatedItem = item as PopulatedMessage

    const embeddingChunkViewer = populatedItem.embedding && populatedItem.embedding?.length > 0 ?
        populatedItem.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                item={chunk}
                items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
        )) : <Typography>No embeddings available</Typography>;

    const charCount = populatedItem.content.length;
    const tokenCount = Math.round(charCount / 3);
    const subTitle = (
        <Box className="flex items-center gap-2">
            <Tooltip title={`Type: ${populatedItem.type}`} arrow>
                <IconButton size="small">{getMessageTypeIcon(populatedItem.type)}</IconButton>
            </Tooltip>
            <Chip
                icon={<Timer className="text-gray-600" />}
                label={`~${tokenCount} tokens`}
                size="small"
                className="bg-gray-100"
            />
            <Chip
                icon={<TextFields className="text-gray-600" />}
                label={`${charCount} characters`}
                size="small"
                className="bg-gray-100"
            />
        </Box>
    )
    const listItems = [
        {
            icon: <TextSnippet />,
            primary_text: "Content",
            secondary_text:
                <AliceMarkdown
                    enabledBlocks={[CustomBlockType.ALICE_DOCUMENT, CustomBlockType.ANALYSIS]}
                    role={populatedItem.role}
                    showCopyButton
                >
                    {populatedItem.content}
                </AliceMarkdown>
        },
        {
            icon: <Person />,
            primary_text: "Role",
            secondary_text: populatedItem.role
        },
        {
            icon: <PersonPin />,
            primary_text: "Assistant Name",
            secondary_text: populatedItem.assistant_name ?? "N/A"
        },
        {
            icon: <Engineering />,
            primary_text: "Generated By",
            secondary_text: populatedItem.generated_by
        },
        {
            icon: <AttachFile />,
            primary_text: "References",
            secondary_text: populatedItem.references && hasAnyReferences(populatedItem.references as References) ?
                <ReferencesViewer
                    references={populatedItem.references}
                /> : "N/A"
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
        },
        {
            icon: <Person />,
            primary_text: "Metadata",
            secondary_text: populatedItem.creation_metadata ? <CodeBlock language="json" code={JSON.stringify(populatedItem.creation_metadata, null, 2)} /> : "N/A",
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created At",
            secondary_text: new Date(populatedItem.createdAt || '').toLocaleString()
        }
    ];

    return (
        <CommonCardView
            elementType='Message'
            title={populatedItem.role}
            subtitle={subTitle}
            id={populatedItem._id}
            listItems={listItems}
            item={populatedItem}
            itemType='messages'
        />
    );
};

export default MessageCardView;