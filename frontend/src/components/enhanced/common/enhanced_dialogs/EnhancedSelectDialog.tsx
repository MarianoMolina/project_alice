import { useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { CollectionElement, CollectionPopulatedElement, CollectionElementString } from '../../../../types/CollectionTypes';
import { useDialog } from '../../../../contexts/DialogContext';
import { useApi } from '../../../../contexts/ApiContext';
import Logger from '../../../../utils/Logger';

const EnhancedSelectDialog = () => {
  const { fetchItem } = useApi();
  const {
    isSelectDialogOpen,
    selectedComponentType,
    selectedEnhancedView,
    selectedItems,
    onSelectCallback,
    selectDialogTitle,
    selectDialogFilters,
    selectDialogMultiple,
    closeSelectDialog,
    selectDialogZIndex,
    selectCardItem
  } = useDialog();

  // Early return if required props are missing
  if (!selectedComponentType || !selectedEnhancedView || !selectDialogTitle || !onSelectCallback) {
    return null;
  }

  const handleInteraction = useCallback(async (item: CollectionElement | CollectionPopulatedElement) => {
    try {
      Logger.debug('EnhancedSelectDialog - handleInteraction', { item });
      // For multiple selection, we might want to accumulate items instead of just using the last one
      if (selectDialogMultiple) {
        // TODO: Implement multiple selection logic
        Logger.warn('Multiple selection not yet implemented');
      }
      
      // Fetch the full item data if needed
      const selectedItem = item._id 
        ? await fetchItem(selectedComponentType, item._id) as CollectionElement
        : item;
      
      await onSelectCallback(selectedItem);
      closeSelectDialog();
    } catch (error) {
      Logger.error('EnhancedSelectDialog - Error selecting item:', error);
    }
  }, [selectedComponentType, selectDialogMultiple, onSelectCallback, closeSelectDialog, fetchItem]);

  const handleView = useCallback((item: CollectionElement | CollectionPopulatedElement) => {
    selectCardItem(selectedComponentType as CollectionElementString, item._id!);
  }, [selectCardItem, selectedComponentType]);

  const memoizedContent = useMemo(() => {
    const EnhancedComponent = selectedEnhancedView;
    return (
      <EnhancedComponent
        mode="shortList"
        fetchAll={true}
        onInteraction={handleInteraction}
        onView={handleView}
        isInteractable={true}
        filters={selectDialogFilters}
        selectedItems={selectedItems}
      />
    );
  }, [selectedEnhancedView, handleInteraction, handleView, selectDialogFilters, selectedItems]);

  return (
    <Dialog
      open={isSelectDialogOpen}
      onClose={closeSelectDialog}
      maxWidth="md"
      fullWidth
      sx={{ zIndex: selectDialogZIndex }}
    >
      <DialogTitle>{selectDialogTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ minHeight: '400px', mt: 2 }}>
          {memoizedContent}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeSelectDialog} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedSelectDialog;