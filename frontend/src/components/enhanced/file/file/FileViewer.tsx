import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Visibility as VisibilityIcon,
  AccessTime as TimeIcon,
  Download
} from '@mui/icons-material';
import { FileType, FileComponentProps } from '../../../../types/FileTypes';
import { getFileSize } from '../../../../utils/FileUtils';
import Logger from '../../../../utils/Logger';
import { retrieveFile } from '../../../../services/api';
import { useDialog } from '../../../../contexts/DialogContext';
import { getFileIcon } from '../../../../utils/MessageUtils';

const FileViewer: React.FC<FileComponentProps> = ({ item }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectCardItem } = useDialog();

  const handleDownload = async () => {
    try {
      if (!item?._id) return;
      
      const blob = await retrieveFile(item._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      Logger.error('Error downloading file:', err);
    }
  };

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (item && 'content' in item && item.content) {
          setContent(item.content as string);
        } else if (item?._id) {
          const blob = await retrieveFile(item._id);
          const reader = new FileReader();
          reader.onloadend = () => setContent(reader.result as string);
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        Logger.error('Error loading file content:', err);
        setError('Failed to load preview');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [item]);

  if (!item) return null;

  const handleViewDetails = () => {
    selectCardItem("File", item._id);
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <Box className="flex justify-center items-center h-40">
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box className="flex justify-center items-center h-40 bg-gray-50 rounded">
          <Typography color="error" variant="body2">{error}</Typography>
        </Box>
      );
    }

    switch (item.type) {
      case FileType.IMAGE:
        return (
          <Box className="flex justify-center items-center overflow-hidden rounded" 
               sx={{ maxHeight: '200px' }}>
            <img 
              src={content} 
              alt={item.filename}
              className="object-contain w-full h-full"
            />
          </Box>
        );
      case FileType.AUDIO:
        return (
          <Box className="p-4 bg-gray-50 rounded">
            <audio controls src={content} className="w-full" />
          </Box>
        );
      case FileType.VIDEO:
        return (
          <Box className="flex justify-center items-center rounded overflow-hidden"
               sx={{ maxHeight: '200px' }}>
            <video controls src={content} className="w-full h-full object-contain" />
          </Box>
        );
      default:
        return (
          <Box className="p-4 bg-gray-50 rounded">
            <Typography variant="body2" className="font-mono break-all line-clamp-3">
              {content && content.startsWith('data:') 
                ? atob(content.split(',')[1]).substring(0, 200) + '...'
                : content.substring(0, 200) + '...'}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Paper className="relative overflow-hidden">
      <Box className="p-4">
        <Stack spacing={3}>
          {/* Header */}
          <Box className="flex items-start justify-between">
            <Stack spacing={1}>
              <Box className="flex items-center gap-2">
                {getFileIcon(item.type)}
                <Typography variant="h6" className="font-semibold">
                  {item.filename}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<FileIcon className="text-gray-600" />}
                  label={item.type.toUpperCase()}
                  size="small"
                  className="bg-gray-100"
                />
                <Chip
                  icon={<TimeIcon className="text-gray-600" />}
                  label={getFileSize(item.file_size).formatted}
                  size="small"
                  className="bg-gray-100"
                />
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download file">
                <IconButton
                  onClick={handleDownload}
                  size="small"
                  className="text-gray-600"
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="View details">
                <IconButton
                  onClick={handleViewDetails}
                  size="small"
                  className="text-gray-600"
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Preview */}
          {renderPreview()}

          {/* Timestamp */}
          <Typography variant="caption" className="text-gray-500">
            Last accessed: {item.last_accessed 
              ? new Date(item.last_accessed).toLocaleString()
              : 'Never'}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export default FileViewer;