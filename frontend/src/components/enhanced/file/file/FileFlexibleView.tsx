import React, { useCallback, useEffect, useState } from 'react';
import {
    TextField,
    Typography,
    Box,
    Button,
} from '@mui/material';
import { FileComponentProps, FileContentReference, FileReference, FileType, getDefaultFileForm } from '../../../../types/FileTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import FileViewer from '../FileViewer';
import Transcript from '../Transcript';
import { bytesToMB, createFileContentReference, selectFile } from '../../../../utils/FileUtils';
import { useApi } from '../../../../contexts/ApiContext';
import { MessageType } from '../../../../types/MessageTypes';
import { useNotification } from '../../../../contexts/NotificationContext';
import Logger from '../../../../utils/Logger';
import { useDialog } from '../../../../contexts/DialogCustomContext';

const FileFlexibleView: React.FC<FileComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { uploadFileContentReference } = useApi();
    const { addNotification } = useNotification();
    const { openDialog } = useDialog();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultFileForm());
        }
    }, [item, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    if (!item && mode !== 'create') {
        return <Typography>No file data available.</Typography>;
    }

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Upload New File' : mode === 'edit' ? 'Edit File' : 'File Details';
    const saveButtonText = item?._id ? 'Update File' : 'Upload File';
    const hasTranscriptSlot = item && item._id && item.type !== 'file';

    const handleOpenDialog = () => {
        openDialog({
            title: 'Confirm File Upload',
            content: `Are you sure you want to upload ${selectedFile?.name}?`,
            buttons: [
                {
                    text: 'Cancel',
                    action: () => addNotification('File upload cancelled', 'info'),
                    color: 'error',
                    variant: 'contained',
                },
                {
                    text: 'Upload',
                    action: handleUploadConfirm,
                    color: 'primary',
                    variant: 'contained',
                }
            ],
        });
    }

    const handleFileUpdate = (updatedFile: FileContentReference) => {
        onChange(updatedFile);
    };

    const handleFileSelect = async () => {
        try {
            const allowedTypes: FileType[] = [FileType.IMAGE, FileType.AUDIO, FileType.VIDEO, FileType.FILE];
            const file = await selectFile(allowedTypes);
            if (file) {
                setSelectedFile(file);
                handleOpenDialog();
            } else {
                Logger.info('No file selected or file type not allowed');
                addNotification('No file selected or file type not allowed', 'info');
            }
        } catch (error) {
            Logger.error('Error selecting file:', error);
            addNotification(`Error selecting file: ${error}`, 'error');
        }
    };


    const handleUploadConfirm = async () => {
        if (selectedFile) {
            const fileContentReference = await createFileContentReference(selectedFile);
            const file = await uploadFileContentReference(fileContentReference);
            if (!file) {
                addNotification('File upload failed or was cancelled', 'error');
                Logger.info('File upload failed or was cancelled');
                return;
            }
            onChange(file);
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
                {item && item._id && hasTranscriptSlot && (
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
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={mode === "create" ? false : isEditMode}
            item={item as FileReference}
            itemType='files'
        >
            {renderContent()}
        </GenericFlexibleView>
    );
};

export default FileFlexibleView;