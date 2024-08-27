import React, { useState, useCallback, useEffect } from 'react';
import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { FileReference, FileContentReference, FileType } from '../../../types/FileTypes';
import { createFileContentReference, getFileContent } from '../../../utils/FileUtils';

interface FileViewerProps {
  file: FileReference | FileContentReference;
  editable?: boolean;
  onUpdate?: (updatedFile: FileContentReference) => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, editable = false, onUpdate }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Loading content for file:', file.filename, 'Type:', file.type);
        if ('content' in file) {
          console.log('File has content property, using it directly');
          setContent(file.content);
        } else {
          console.log('Fetching file content');
          const fileContent = await getFileContent(file);
          setContent(fileContent);
        }
        console.log('Content loaded, preview:', content.substring(0, 100));
      } catch (err) {
        console.error('Error loading file content:', err);
        setError('Failed to load file content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadContent();
  }, [file]);

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const newFile = event.target.files[0];
      console.log('New file selected:', newFile.name, 'Type:', newFile.type);
      const fileContentReference = await createFileContentReference(newFile);
      setContent(fileContentReference.content);
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const newFile = event.dataTransfer.files[0];
      console.log('File dropped:', newFile.name, 'Type:', newFile.type);
      const fileContentReference = await createFileContentReference(newFile);
      setContent(fileContentReference.content);
    }
  }, []);

  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      const updatedFile: FileContentReference = {
        ...file,
        content: content,
      };
      onUpdate(updatedFile);
    }
  }, [file, content, onUpdate]);

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const getContentUrl = () => {
    console.log('Getting content URL for file:', file.filename, 'Type:', file.type);
    console.log('Content preview:', content.substring(0, 100));
    
    if (content.startsWith('data:')) {
      console.log('Content is already in data URL format');
      return content;
    }
    
    let mimeType;
    switch (file.type) {
      case FileType.IMAGE:
        mimeType = `image/${file.filename.split('.').pop()}`;
        break;
      case FileType.AUDIO:
        mimeType = `audio/${file.filename.split('.').pop()}`;
        break;
      case FileType.VIDEO:
        mimeType = `video/${file.filename.split('.').pop()}`;
        break;
      case FileType.TEXT:
        mimeType = 'text/plain';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
    
    const contentUrl = `data:${mimeType};base64,${btoa(content)}`;
    console.log('Generated content URL:', contentUrl.substring(0, 100));
    return contentUrl;
  };

  const renderContent = () => {
    const contentUrl = getContentUrl();
    console.log('Rendering content for file:', file.filename, 'Type:', file.type);
    console.log('Content URL preview:', contentUrl.substring(0, 100));

    switch (file.type) {
      case FileType.TEXT:
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
        return <img src={contentUrl} alt={file.filename} style={{ maxWidth: '100%' }} />;
      case FileType.AUDIO:
        return <audio controls src={contentUrl} />;
      case FileType.VIDEO:
        return <video controls src={contentUrl} style={{ maxWidth: '100%' }} />;
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
          <input
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button variant="contained" component="span">
              Choose New File
            </Button>
          </label>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            style={{ marginLeft: '1rem' }}
          >
            Confirm Changes
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FileViewer;