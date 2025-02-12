import { IconButton, Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BaseDatabaseObject, CollectionName, CollectionPopulatedType, collectionNameToElementString } from '../../../types/CollectionTypes';
import { useDialog } from '../../../contexts/DialogContext';
import { FileCopy } from '@mui/icons-material';

interface DuplicateEntityProps<T extends CollectionName> {
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

export function cleanForDuplication<T extends BaseDatabaseObject>(item: T, itemType: CollectionName): Partial<T> {
  // Create a shallow copy of the item
  const cleanedItem = { ...item };

  // Remove common DB fields
  delete cleanedItem._id;
  delete cleanedItem.createdAt;
  delete cleanedItem.updatedAt;
  delete cleanedItem.created_by;
  delete cleanedItem.updated_by;

  // Handle special cases
  if (itemType === 'chats') {
    delete (cleanedItem as any).messages;
  }

  return cleanedItem;
}

// Modified DuplicateEntity component
export function DuplicateEntity<T extends CollectionName>({
  item,
  itemType,
  tooltipText,
  showLabel = false
}: DuplicateEntityProps<T>) {
  const { selectFlexibleItem } = useDialog();

  const handleDuplicate = () => {
    const elementString = collectionNameToElementString[itemType];
    const cleanedItem = cleanForDuplication(item, itemType);
    selectFlexibleItem(elementString, 'create', undefined, cleanedItem);
  };

  // Rest of the component remains the same
  const defaultTooltip = `Duplicate ${collectionNameToElementString[itemType]}`;

  const content = (
    <ActionBox onClick={handleDuplicate}>
      <FileCopy fontSize="small" />
      {showLabel && (
        <Typography>Duplicate</Typography>
      )}
    </ActionBox>
  );

  if (showLabel) {
    return content;
  }

  return (
    <StyledIconButton onClick={handleDuplicate} size="small" title={tooltipText || defaultTooltip}>
      <FileCopy />
    </StyledIconButton>
  );
}
