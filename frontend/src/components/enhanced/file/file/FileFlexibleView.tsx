import React, { useCallback, useEffect, useState } from 'react';
import {
    Typography,
    Box,
    Button,
    Paper,
    Stack,
    Chip,
} from '@mui/material';
import {
    InsertDriveFile as FileIcon,
    TextFields,
    AccessTime as TimeIcon,
    Timer
} from '@mui/icons-material';
import { FileComponentProps, FileContentReference, FileReference, FileType, getDefaultFileForm, PopulatedFileReference } from '../../../../types/FileTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Transcript from '../Transcript';
import { createFileContentReference, getFileSize, selectFile } from '../../../../utils/FileUtils';
import { useApi } from '../../../../contexts/ApiContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import Logger from '../../../../utils/Logger';
import { useDialog } from '../../../../contexts/DialogCustomContext';
import { TextInput } from '../../common/inputs/TextInput';
import FileContentView from './FileContentView';

const FileFlexibleView: React.FC<FileComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [form, setForm] = useState<Partial<PopulatedFileReference>>(() => item as PopulatedFileReference || getDefaultFileForm());
    const [isSaving, setIsSaving] = useState(false);
    const { uploadFileContentReference } = useApi();
    const { addNotification } = useNotification();
    const { openDialog } = useDialog();

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Upload New File' : mode === 'edit' ? 'Edit File' : 'File Details';
    const saveButtonText = item?._id ? 'Update File' : 'Upload File';
    const hasTranscriptSlot = item && item._id && item.type !== 'file';
    const charCount = item?.transcript?.content.length || 0;
    const tokenCount = Math.round(charCount / 3);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item) {
            setForm(item as PopulatedFileReference);
        } else if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultFileForm());
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof FileReference | keyof FileContentReference, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

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

    const handleFileUpdate = (updatedFile: Partial<FileContentReference> | Partial<FileReference>) => {
        if (updatedFile) {
            setForm(updatedFile as PopulatedFileReference);
        }
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
            setForm(file as PopulatedFileReference);
        }
    };


    const renderFileDetails = () => {
        if (!form) return null;

        return (
            <Paper className="p-4">
                <Stack spacing={3}>
                    <Box>
                        <TextInput
                            name='filename'
                            label='Filename'
                            value={form.filename || ''}
                            onChange={(value) => handleFieldChange('filename', value)}
                            disabled={!isEditMode}
                            description='Enter the filename for the file. It should contain its extension.'
                        />
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Chip
                            icon={<FileIcon className="text-gray-600" />}
                            label={form.type?.toUpperCase()}
                            size="small"
                            className="bg-gray-100"
                        />
                        <Chip
                            icon={<TimeIcon className="text-gray-600" />}
                            label={form.file_size && getFileSize(form.file_size).formatted}
                            size="small"
                            className="bg-gray-100"
                        />
                        {hasTranscriptSlot && (
                            <>
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
                            </>
                        )}
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Last Accessed
                        </Typography>
                        <Typography variant="body1">
                            {form.last_accessed ? new Date(form.last_accessed).toLocaleString() : 'Never'}
                        </Typography>
                    </Box>

                    <Box className="mt-4">
                        <FileContentView
                            item={item as FileReference}
                            mode={mode}
                            onChange={handleFileUpdate}
                            items={null}
                            handleSave={async () => { }}
                        />
                    </Box>

                    {hasTranscriptSlot && (
                        <Box className="mt-4">
                            <Transcript
                                fileId={form._id ?? ''}
                                transcript={form.transcript}
                                onTranscriptUpdate={(value) => handleFieldChange('transcript', value)}
                            />
                        </Box>
                    )}
                </Stack>
            </Paper>
        );
    };

    const renderUploadSection = () => (
        <Paper className="p-8 text-center">
            <Stack spacing={2} alignItems="center">
                <FileIcon sx={{ fontSize: 48 }} color="action" />
                <Typography variant="h6" color="text.secondary">
                    Select a file to upload
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleFileSelect}
                    size="large"
                >
                    Select File
                </Button>
            </Stack>
        </Paper>
    );

    const renderContent = () => {
        if (mode === 'create') {
            return renderUploadSection();
        }
        return renderFileDetails();
    };

    if (!item && mode !== 'create') {
        return (
            <Paper className="p-4">
                <Typography color="text.secondary" align="center">
                    No file data available.
                </Typography>
            </Paper>
        );
    }

    return (
        <GenericFlexibleView
            elementType='File'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={mode === "create" ? false : isEditMode}
            mode={mode}
            item={form as PopulatedFileReference}
            itemType='files'
        >
            {renderContent()}
        </GenericFlexibleView>
    );
};

export default FileFlexibleView;