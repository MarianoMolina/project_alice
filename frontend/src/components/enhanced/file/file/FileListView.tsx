import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { getFileSize } from '../../../../utils/FileUtils';

const FileListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (file: FileReference) => file.filename;
    
    const getSecondaryText = (file: FileReference) => {
        return (
            <Typography component="span" variant="body2" color="textSecondary">
                Type: {file.type}, Size: {getFileSize(file.file_size).formatted} 
            </Typography>
        );
    };
    
    return (
        <EnhancedListView<FileReference>
            items={items as FileReference[]}
            item={item as FileReference}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select File"
            viewTooltip="View File Details"
            collectionElementString='File'
        />
    );
};

export default FileListView;