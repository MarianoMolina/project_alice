import React from 'react';
import { Typography } from '@mui/material';
import { FileComponentProps } from '../../../../types/FileTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { InsertDriveFile, CalendarToday, AccessTime, TextSnippet, AttachFile } from '@mui/icons-material';
import FileViewer from '../FileViewer';
import { bytesToMB } from '../../../../utils/FileUtils';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const FileCardView: React.FC<FileComponentProps> = ({ item }) => {

    if (!item) {
        return <Typography>No file data available.</Typography>;
    }

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
        }
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