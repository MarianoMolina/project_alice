import React from 'react';
import { Box, Typography } from '@mui/material';
import { ImageReference } from '../../../types/EntityReferenceTypes';

// ImageReferenceViewer Component
interface ImageReferenceViewerProps {
  image: ImageReference;
  className?: string;
}

const ImageReferenceViewer: React.FC<ImageReferenceViewerProps> = ({ image, className }) => {
  return (
    <Box className={`flex flex-col items-center gap-2 ${className}`}>
      <img 
        src={image.url} 
        alt={image.alt || 'Image'} 
        className="max-w-full h-auto rounded-lg shadow-md"
      />
      {image.caption && (
        <Typography 
          variant="caption" 
          className="text-center text-gray-600 mt-1"
        >
          {image.caption}
        </Typography>
      )}
    </Box>
  );
};

export default ImageReferenceViewer;