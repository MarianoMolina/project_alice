import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { bytesToMB } from '../../../../utils/FileUtils';

const FileListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (file: FileReference) => file.filename;
    const getSecondaryText = (file: FileReference) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Type: {file.type}, Size: {bytesToMB(file.file_size)}, Last accessed: {file.last_accessed ? new Date(file.last_accessed).toLocaleString() : 'Never'}
        </Typography>
    );

    return (
        <EnhancedListView<FileReference>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select File"
            viewTooltip="View File Details"
        />
    );
};

export default FileListView;