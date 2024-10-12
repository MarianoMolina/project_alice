import React from 'react';
import { List, Typography } from '@mui/material';
import { CollectionElementString } from '../../../../types/CollectionTypes';
import EnhancedListItem from './ListItem';

interface EnhancedListViewProps<T> {
  items: T[] | null;
  item: T | null;
  getPrimaryText: (item: T) => string;
  getSecondaryText: (item: T) => React.ReactNode;
  onView?: (item: T) => void;
  onInteraction?: (item: T) => void;
  interactionTooltip?: string;
  viewTooltip?: string;
  maxCharacters?: number;
  collectionElementString?: CollectionElementString; // Made optional
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
  maxCharacters = 60,
  collectionElementString, // Added here
}: EnhancedListViewProps<T>) {
  if (!items && !item) {
    return <Typography>No data available.</Typography>;
  }

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
      maxCharacters={maxCharacters}
      collectionElement={collectionElementString} // Pass it directly; it can be undefined
    />
  );

  return (
    <List sx={{padding:0}}>
      {item ? renderItem(item, 0) : items!.map(renderItem)}
    </List>
  );
}

export default EnhancedListView;