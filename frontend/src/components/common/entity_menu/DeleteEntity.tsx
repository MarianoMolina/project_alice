import { IconButton, Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { Delete } from '@mui/icons-material';
import { CollectionName, collectionNameToElementString } from '../../../types/CollectionTypes';

interface DeleteEntityProps<T extends CollectionName> {
  itemType: T;
  tooltipText?: string;
  handleDelete: () => void;
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

export function DeleteEntity<T extends CollectionName>({
  itemType,
  tooltipText,
  handleDelete,
  showLabel = false
}: DeleteEntityProps<T>) {
  if (!handleDelete) return null;

  const defaultTooltip = `Delete ${collectionNameToElementString[itemType]}`;
  const content = (
    <ActionBox onClick={handleDelete}>
      <Delete fontSize="small" />
      {showLabel && (
        <Typography>Delete</Typography>
      )}
    </ActionBox>
  );

  if (showLabel) {
    return content;
  }

  return (
    <StyledIconButton onClick={handleDelete} size="small" title={tooltipText || defaultTooltip}>
      <Delete />
    </StyledIconButton>
  );
}