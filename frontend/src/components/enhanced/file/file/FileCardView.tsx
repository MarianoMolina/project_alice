import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { FileComponentProps } from '../../../../types/FileTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CalendarToday, AccessTime, TextSnippet, AttachFile, QueryBuilder, DataObject, Timer, TextFields } from '@mui/icons-material';
import { getFileSize } from '../../../../utils/FileUtils';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import EmbeddingChunkViewer from '../../embedding_chunk/embedding_chunk/EmbeddingChunkViewer';
import FileContentView from './FileContentView';
import { getFileIcon } from '../../../../utils/MessageUtils';

const FileCardView: React.FC<FileComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No file data available.</Typography>;
    }

    const embeddingChunkViewer = item.embedding && item.embedding?.length > 0 ?
        item.embedding.map((chunk, index) => (
            <EmbeddingChunkViewer
                key={chunk._id || `embedding-${index}`}
                item={chunk}
                items={null} onChange={() => null} mode={'view'} handleSave={async () => { }}
            />
        )) : <Typography>No embeddings available</Typography>;

    const charCount = item?.transcript?.content.length || 0;
    const tokenCount = Math.round(charCount / 3);

    const transcript = item.transcript ? (
        <Stack direction="column" spacing={1}>
            <Box className="flex items-center gap-2">
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
            <AliceMarkdown showCopyButton>{item.transcript.content}</AliceMarkdown>
        </Stack>
    ) : 'N/A';

    const listItems = [
        {
            icon: <AttachFile />,
            primary_text: "File Preview",
            secondary_text: <FileContentView item={item} items={null} onChange={() => null} mode={'view'} handleSave={async () => { }} />
        },
        {
            icon: getFileIcon(item.type),
            primary_text: "File Type",
            secondary_text: item.type
        },
        {
            icon: <TextSnippet />,
            primary_text: "Transcript",
            secondary_text: transcript
        },
        {
            icon: <AccessTime />,
            primary_text: "File Size",
            secondary_text: getFileSize(item.file_size).formatted
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
        },
        {
            icon: <CalendarToday />,
            primary_text: "Last Accessed",
            secondary_text: item.last_accessed ? new Date(item.last_accessed).toLocaleString() : 'Never'
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='File'
            title={item.filename}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='files'
        >
        </CommonCardView>
    );
};

export default FileCardView;