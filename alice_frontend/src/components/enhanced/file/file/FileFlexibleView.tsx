import React from 'react';
import {
    TextField,
    Typography,
    Box,
} from '@mui/material';
import { FileComponentProps, FileContentReference } from '../../../../types/FileTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import FileViewer from '../FileViewer';

const FileFlexibleView: React.FC<FileComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    if (!item) {
        return <Typography>No file data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Upload New File' : mode === 'edit' ? 'Edit File' : 'File Details';
    const saveButtonText = item._id ? 'Update File' : 'Upload File';

    const handleFileUpdate = (updatedFile: FileContentReference) => {
        onChange(updatedFile);
    };

    return (
        <GenericFlexibleView
            elementType='File'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                label="Filename"
                value={item.filename || ''}
                onChange={(e) => onChange({ ...item, filename: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="body1">File Type: {item.type}</Typography>
            <Typography variant="body1">File Size: {item.file_size} bytes</Typography>
            <Typography variant="body1">Last Accessed: {item.last_accessed ? item.last_accessed.toLocaleString() : 'Never'}</Typography>
            <Box mt={2}>
                <FileViewer
                    file={item}
                    editable={isEditMode}
                    onUpdate={handleFileUpdate}
                />
            </Box>
        </GenericFlexibleView>
    );
};

export default FileFlexibleView;