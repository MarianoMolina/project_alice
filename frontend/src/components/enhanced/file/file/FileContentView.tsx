import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon
} from '@mui/icons-material';
import { FileType, FileComponentProps } from '../../../../types/FileTypes';
import { retrieveFile } from '../../../../services/api';
import Logger from '../../../../utils/Logger';

const FileContentView: React.FC<FileComponentProps> = ({ item }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [item]);

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

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center p-4">
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex justify-center items-center p-4">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="relative">
      {/* Download button */}
      <Box className="absolute top-2 right-2 z-10">
        <Tooltip title="Download file">
          <IconButton
            onClick={handleDownload}
            size="small"
            className="bg-white bg-opacity-75 hover:bg-opacity-100"
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      {item?.type === FileType.IMAGE && (
        <img
          src={content}
          alt={item.filename}
          className="w-full max-h-[600px] object-contain rounded"
        />
      )}

      {item?.type === FileType.VIDEO && (
        <video
          controls
          src={content}
          className="w-full max-h-[600px] rounded"
        />
      )}

      {item?.type === FileType.AUDIO && (
        <audio
          controls
          src={content}
          className="w-full"
        />
      )}

      {item?.type === FileType.FILE && (
        <Box className="p-4 bg-gray-50 rounded font-mono whitespace-pre-wrap break-all max-h-[400px] overflow-auto">
          {content && content.startsWith('data:') 
            ? atob(content.split(',')[1])
            : content}
        </Box>
      )}
    </Box>
  );
};

export default FileContentView;