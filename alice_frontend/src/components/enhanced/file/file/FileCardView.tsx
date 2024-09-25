import React from 'react';
import { Typography, Box } from '@mui/material';
import { FileComponentProps } from '../../../../types/FileTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { InsertDriveFile, CalendarToday, AccessTime, TextSnippet } from '@mui/icons-material';
import FileViewer from '../FileViewer';
import useStyles from '../FileStyles';
import { bytesToMB } from '../../../../utils/FileUtils';

const FileCardView: React.FC<FileComponentProps> = ({ item }) => {
    const classes = useStyles();

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
            secondary_text: item.transcript ? item.transcript.content : 'N/A'
        }
    ];

    return (
        <CommonCardView
            elementType='File'
            title={item.filename}
            id={item._id}
            listItems={listItems}
        >
            <Box className={classes.filePreviewContainer}>
                <Typography variant="h6" className={classes.previewTitle}>File Preview</Typography>
                <FileViewer
                    file={item}
                    editable={false}
                />
            </Box>
        </CommonCardView>
    );
};

export default FileCardView;