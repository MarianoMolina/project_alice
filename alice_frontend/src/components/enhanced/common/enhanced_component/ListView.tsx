import React, { useCallback } from 'react';
import {
  List,
  ListItem,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ListItemStyled = styled(ListItem)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
}));

const ContentBox = styled(Box)({
  flexGrow: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const ButtonBox = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  width: '80px',
});

interface EnhancedListItemProps<T> {
  item: T;
  primaryText: string;
  secondaryText: React.ReactNode;
  onView?: (item: T) => void;
  onInteraction?: (item: T) => void;
  interactionTooltip?: string;
  viewTooltip?: string;
}

// Define the component as a generic function component
function EnhancedListItemComponent<T>({
  item,
  primaryText,
  secondaryText,
  onView,
  onInteraction,
  interactionTooltip = 'Select Item',
  viewTooltip = 'View Item',
}: EnhancedListItemProps<T>) {
  // Memoize event handlers to prevent unnecessary re-renders
  const handleView = useCallback(() => onView?.(item), [onView, item]);
  const handleInteraction = useCallback(() => onInteraction?.(item), [onInteraction, item]);

  return (
    <>
      <ListItemStyled>
        <ContentBox>
          <Typography variant="body1">{primaryText}</Typography>
          <Box>{secondaryText}</Box>
        </ContentBox>
        <ButtonBox>
          {onView && (
            <Tooltip title={viewTooltip}>
              <IconButton size="small" onClick={handleView}>
                <Visibility />
              </IconButton>
            </Tooltip>
          )}
          {onInteraction && (
            <Tooltip title={interactionTooltip}>
              <IconButton size="small" onClick={handleInteraction}>
                <ChevronRight />
              </IconButton>
            </Tooltip>
          )}
        </ButtonBox>
      </ListItemStyled>
      <Divider />
    </>
  );
}

// Explicitly type the memoized component with generics
const EnhancedListItem = React.memo(
  EnhancedListItemComponent
) as <T>(props: EnhancedListItemProps<T>) => JSX.Element;

interface EnhancedListViewProps<T> {
  items: T[] | null;
  item: T | null;
  getPrimaryText: (item: T) => string;
  getSecondaryText: (item: T) => React.ReactNode;
  onView?: (item: T) => void;
  onInteraction?: (item: T) => void;
  interactionTooltip?: string;
  viewTooltip?: string;
}

function EnhancedListView<T>({
  items,
  item,
  getPrimaryText,
  getSecondaryText,
  onView,
  onInteraction,
  interactionTooltip,
  viewTooltip,
}: EnhancedListViewProps<T>) {
  if (!items && !item) {
    return <Typography>No data available.</Typography>;
  }

  // Use stable keys for list items
  const renderItem = (itemToRender: T, index: number) => (
    <EnhancedListItem
      key={index}
      item={itemToRender}
      primaryText={getPrimaryText(itemToRender)}
      secondaryText={getSecondaryText(itemToRender)}
      onView={onView}
      onInteraction={onInteraction}
      interactionTooltip={interactionTooltip}
      viewTooltip={viewTooltip}
    />
  );

  return (
    <List>
      {item ? renderItem(item, 0) : items!.map(renderItem)}
    </List>
  );
}

export default EnhancedListView;
