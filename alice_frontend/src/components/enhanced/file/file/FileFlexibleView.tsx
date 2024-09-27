import React, { useState } from 'react';
import {
    TextField,
    Typography,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { FileComponentProps, FileContentReference, FileReference, FileType } from '../../../../types/FileTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import FileViewer from '../FileViewer';
import Transcript from '../Transcript';
import { bytesToMB, createFileContentReference, selectFile } from '../../../../utils/FileUtils';
import { useApi } from '../../../../context/ApiContext';
import { MessageType } from '../../../../types/MessageTypes';
import { useNotification } from '../../../../context/NotificationContext';

const FileFlexibleView: React.FC<FileComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { uploadFileContentReference } = useApi();
    const { addNotification } = useNotification();

    if (!item && mode !== 'create') {
        return <Typography>No file data available.</Typography>;
    }

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Upload New File' : mode === 'edit' ? 'Edit File' : 'File Details';
    const saveButtonText = item?._id ? 'Update File' : 'Upload File';

    const handleFileUpdate = (updatedFile: FileContentReference) => {
        onChange(updatedFile);
    };

    const handleFileSelect = async () => {
        try {
            const allowedTypes: FileType[] = [FileType.IMAGE, FileType.AUDIO, FileType.VIDEO];
            const file = await selectFile(allowedTypes);
            if (file) {
                setSelectedFile(file);
                setIsDialogOpen(true);
            } else {
                console.log('No file selected or file type not allowed');
                addNotification('No file selected or file type not allowed', 'info');
            }
        } catch (error) {
            console.error('Error selecting file:', error);
            addNotification(`Error selecting file: ${error}`, 'error');
        }
    };


    const handleUploadConfirm = async () => {
        if (selectedFile) {
            const fileContentReference = await createFileContentReference(selectedFile);
            const file = await uploadFileContentReference(fileContentReference);
            if (!file) {
                addNotification('File upload failed or was cancelled', 'error');
                console.log('File upload failed or was cancelled');
                return;
            }
            onChange(file);
            setIsDialogOpen(false);
        }
    };

    const handleTranscriptUpdate = (newTranscript: MessageType) => {
        onChange({ ...item, transcript: newTranscript } as FileReference);
    };

    const renderContent = () => {
        if (mode === 'create') {
            return (
                <Box>
                    <Button variant="contained" onClick={handleFileSelect}>
                        Select File to Upload
                    </Button>
                    <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                        <DialogTitle>Confirm File Upload</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to upload {selectedFile?.name}?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUploadConfirm} color="primary">
                                Upload
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            );
        }

        return (
            <>
                <TextField
                    fullWidth
                    label="Filename"
                    value={item?.filename || ''}
                    onChange={(e) => onChange({ ...item, filename: e.target.value } as FileReference)}
                    margin="normal"
                    disabled={!isEditMode}
                />
                <Typography variant="body1">File Type: {item?.type}</Typography>
                <Typography variant="body1">{bytesToMB(item?.file_size ?? 0)}</Typography>
                <Typography variant="body1">
                    Last Accessed: {item?.last_accessed ? new Date(item.last_accessed).toLocaleString() : 'Never'}
                </Typography>
                <Box mt={2}>
                    <FileViewer
                        file={item as FileReference}
                        editable={isEditMode}
                        onUpdate={handleFileUpdate}
                    />
                </Box>
                {item && item._id && (
                    <Box mt={2}>
                        <Transcript
                            fileId={item._id}
                            transcript={item.transcript}
                            onTranscriptUpdate={handleTranscriptUpdate}
                        />
                    </Box>
                )}
            </>
        );
    };

    return (
        <GenericFlexibleView
            elementType='File'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={mode === "create" ? false : isEditMode}
        >
            {renderContent()}
        </GenericFlexibleView>
    );
};

export default FileFlexibleView;