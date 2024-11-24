import React from 'react';
import { Typography } from '@mui/material';
import { FileComponentProps } from '../../../../types/FileTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { InsertDriveFile, CalendarToday, AccessTime, TextSnippet, AttachFile, QueryBuilder, DataObject } from '@mui/icons-material';
import FileViewer from '../FileViewer';
import { bytesToMB } from '../../../../utils/FileUtils';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';
import EmbeddingChunkViewer from '../../embedding_chunk/EmbeddingChunkViewer';

const FileCardView: React.FC<FileComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No file data available.</Typography>;
    }

    const embeddingChunkViewer = item.embedding?.length > 0 ?
     item.embedding.map((chunk, index) => (
        <EmbeddingChunkViewer
            key={chunk._id || `embedding-${index}`}
            chunk={chunk}
        />
    )) : <Typography>No embeddings available</Typography>;
    
    const listItems = [
        {
            icon: <InsertDriveFile />,
            primary_text: "File Type",
            secondary_text: item.type
        },
        {
            icon: <AccessTime />,
            primary_text: "File Size",
            secondary_text: bytesToMB(item.file_size)
        },
        {
            icon: <CalendarToday />,
            primary_text: "Last Accessed",
            secondary_text: item.last_accessed ? new Date(item.last_accessed).toLocaleString() : 'Never'
        },
        {
            icon: <TextSnippet />,
            primary_text: "Transcript",
            secondary_text: item.transcript ? <AliceMarkdown showCopyButton>{item.transcript.content}</AliceMarkdown> : 'N/A'
        },
        {
            icon: <AttachFile />,
            primary_text: "File Preview",
            secondary_text: <FileViewer file={item} editable={false} />
        },
        {
            icon: <DataObject />,
            primary_text: "Embedding",
            secondary_text: embeddingChunkViewer
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