import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { FileReference, FileContentReference, FileType } from '../../../types/FileTypes';
import { createFileContentReference, selectFile } from '../../../utils/FileUtils';
import { retrieveFile, updateFile } from '../../../services/api';
import { useNotification } from '../../../contexts/NotificationContext';
import Logger from '../../../utils/Logger';

interface FileViewerProps {
  file: Partial<FileReference> | Partial<FileContentReference>;
  editable?: boolean;
  onUpdate?: (updatedFile: FileContentReference) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, editable = false, onUpdate }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotification();
  
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if ('content' in file && file.content) {
          setContent(file.content);
        } else if (file._id) {
          const blob = await retrieveFile(file._id);
          const reader = new FileReader();
          reader.onloadend = () => setContent(reader.result as string);
          reader.readAsDataURL(blob);
        } else {
          throw new Error('Invalid file object');
        }
      } catch (err) {
        Logger.error('Error loading file content:', err);
        setError('Failed to load file content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
  
    loadContent();
  }, [file]);
  

  const handleUpdateFile = async () => {
    const allowedTypes = file.type ? [file.type as FileType] : Object.values(FileType);
    const newFile = await selectFile(allowedTypes);
    if (!newFile) return;
    const updatedFile = await updateFile(newFile, file._id);
    
    if (updatedFile) {
      Logger.info('File updated successfully:', updatedFile);
      file = updatedFile;
    } else {
      addNotification('File upload failed or was cancelled', 'error');
      Logger.info('File update failed or was cancelled');
    }
  };
  
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };


  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const newFile = event.dataTransfer.files[0];
      Logger.info('File dropped:', newFile.name, 'Type:', newFile.type);
      const fileContentReference = await createFileContentReference(newFile);
      setContent(fileContentReference.content);
    }
  }, []);

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const renderContent = () => {
    if (content.length === 0) {
      return <Typography>No content available</Typography>;
    }

    switch (file.type) {
      case FileType.FILE:
        return (
          <TextField
            multiline
            fullWidth
            value={content.startsWith('data:') ? atob(content.split(',')[1]) : content}
            onChange={handleContentChange}
            disabled={!editable}
            InputProps={{
              style: { fontFamily: 'monospace' },
            }}
          />
        );
      case FileType.IMAGE:
        return <img src={content} alt={file.filename} style={{ maxWidth: '100%' }} />;
      case FileType.AUDIO:
        return <audio controls src={content} />;
      case FileType.VIDEO:
        return <video controls src={content} style={{ maxWidth: '100%' }} />;
      default:
        return <Typography>Unsupported file type: {file.type}</Typography>;
    }
  };

  return (
    <Box
      onDrop={editable ? handleDrop : undefined}
      onDragOver={editable ? (e) => e.preventDefault() : undefined}
    >
      {renderContent()}
      {editable && (
        <Box mt={2}>

          <Button variant="contained" color='primary' onClick={handleUpdateFile}>
            Upload New File
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FileViewer;