import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/system';
import { CollectionName, collectionNameToElementString, CollectionPopulatedType } from '../../../../types/CollectionTypes';
import { removeCreatedUpdatedBy } from '../../../../utils/AuthUtils';

interface DownloadEntityProps<T extends CollectionName> {
  item: CollectionPopulatedType[T];
  itemType: T;
  tooltipText?: string;
  showLabel?: boolean;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.light,
  '&:hover': {
    color: theme.palette.primary.dark,
  },
}));

const ActionBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
});

export function DownloadEntity<T extends CollectionName>({
  item,
  itemType,
  tooltipText,
  showLabel = false
}: DownloadEntityProps<T>) {
  const handleDownload = () => {
    const fileName = `${collectionNameToElementString[itemType]}${item._id ? '_' + item._id : ''}.json`;
    const cleanedItem = removeCreatedUpdatedBy(item);
    const json = JSON.stringify(cleanedItem, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const defaultTooltip = `Download ${collectionNameToElementString[itemType]}`;
  const content = (
    <ActionBox onClick={handleDownload}>
      <DownloadIcon fontSize="small" />
      {showLabel && (
        <Typography>Download</Typography>
      )}
    </ActionBox>
  );

  // If we're showing the label (likely in a menu), don't wrap in IconButton/Tooltip
  if (showLabel) {
    return content;
  }

  // For standalone button usage, wrap in IconButton and Tooltip
  return (
    <Tooltip title={tooltipText || defaultTooltip}>
      <StyledIconButton onClick={handleDownload} size="small">
        <DownloadIcon />
      </StyledIconButton>
    </Tooltip>
  );
}