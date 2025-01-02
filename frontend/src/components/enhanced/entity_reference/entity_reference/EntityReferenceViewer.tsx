import React from 'react';
import {
  Box,
  Typography,
  Link,
  Paper,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import {
  Category,
  Source,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import { useDialog } from '../../../../contexts/DialogContext';

const EntityReferenceViewer: React.FC<EntityReferenceComponentProps> = ({ item }) => {
  const { selectCardItem } = useDialog();
  
  if (!item) return null;

  const firstImage = item.images?.[0];
  
  const handleViewDetails = () => {
    selectCardItem("EntityReference", item._id);
  };

  return (
    <Paper className="relative overflow-hidden">
      <Box className="flex p-4 gap-4">
        {/* Content Section */}
        <Box className="flex-grow">
          <Stack spacing={2}>
            {/* Title with expand button */}
            <Box className="flex items-start justify-between">
              <Stack spacing={1} className="flex-grow">
                <Typography variant="h6" className="font-semibold">
                  {item.name}
                </Typography>
                {item.url && (
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    {new URL(item.url).hostname}
                    <LaunchIcon fontSize="small" />
                  </Link>
                )}
              </Stack>
              <IconButton 
                onClick={handleViewDetails}
                size="small"
                className="mt-1"
              >
                <LaunchIcon />
              </IconButton>
            </Box>

            {/* Categories and Source */}
            <Stack spacing={1}>
              <Box className="flex flex-wrap gap-2">
                {item.categories?.map((category) => (
                  <Chip
                    key={category}
                    icon={<Category className="text-gray-600" />}
                    label={category}
                    size="small"
                    className="bg-gray-100 text-gray-700"
                  />
                ))}
              </Box>
              {item.source && (
                <Chip
                  icon={apiTypeIcons[item.source] || <Source />}
                  label={`From ${item.source}`}
                  size="small"
                  variant="outlined"
                  className="w-fit text-gray-600"
                />
              )}
            </Stack>

            {/* Brief description if available */}
            {item.description && (
              <Typography variant="body2" className="text-gray-600 line-clamp-2">
                {item.description}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Image Section */}
        {firstImage && (
          <Box className="w-48 h-48 flex-shrink-0">
            <img
              src={firstImage.url}
              alt={firstImage.alt || item.name}
              className="w-full h-full object-cover rounded"
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default EntityReferenceViewer;