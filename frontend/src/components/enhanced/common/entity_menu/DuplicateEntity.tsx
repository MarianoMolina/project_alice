import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import { styled } from '@mui/system';
import { BaseDatabaseObject, CollectionName, CollectionType, collectionNameToElementString } from '../../../../types/CollectionTypes';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import { FileCopy } from '@mui/icons-material';
import Logger from '../../../../utils/Logger';

interface DuplicateEntityProps<T extends CollectionName> {
  item: CollectionType[T];
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
    delete (cleanedItem as any).default_user_checkpoints;
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
  const { selectFlexibleItem } = useCardDialog();

  const handleDuplicate = () => {
    const elementString = collectionNameToElementString[itemType];
    const cleanedItem = cleanForDuplication(item, itemType);
    Logger.info('DuplicateEntity', elementString, cleanedItem);
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
    <Tooltip title={tooltipText || defaultTooltip}>
      <StyledIconButton onClick={handleDuplicate} size="small">
        <FileCopy />
      </StyledIconButton>
    </Tooltip>
  );
}
