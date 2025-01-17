import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { styled } from '@mui/system';
import { CollectionName, CollectionPopulatedType, collectionNameToElementString } from '../../../types/CollectionTypes';
import { useDialog } from '../../../contexts/DialogContext';

interface EditEntityProps<T extends CollectionName> {
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

export function EditEntity<T extends CollectionName>({
  item,
  itemType,
  tooltipText,
  showLabel = false
}: EditEntityProps<T>) {
  const { selectFlexibleItem } = useDialog();

  const handleEdit = () => {
    const elementString = collectionNameToElementString[itemType];
    selectFlexibleItem(elementString, 'edit', item._id, item);
  };

  const defaultTooltip = `Edit ${collectionNameToElementString[itemType]}`;
  const content = (
    <ActionBox onClick={handleEdit}>
      <EditIcon fontSize="small" />
      {showLabel && (
        <Typography>Edit</Typography>
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
      <StyledIconButton onClick={handleEdit} size="small">
        <EditIcon />
      </StyledIconButton>
    </Tooltip>
  );
}