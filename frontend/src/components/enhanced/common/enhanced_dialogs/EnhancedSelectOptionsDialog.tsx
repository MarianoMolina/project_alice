import { useCallback, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { CollectionElement, CollectionElementString } from '../../../../types/CollectionTypes';
import { useDialog } from '../../../../contexts/DialogContext';

const EnhancedSelectOptionsDialog = () => {
  const {
    isEnhancedOptionsDialogOpen,
    closeEnhancedOptionsDialog,
    enhancedOptionsDialogZIndex,
    selectCardItem,
    enhancedOptionsDialogProps
  } = useDialog();

  const handleInteraction = useCallback((item: CollectionElement) => {
    if (!enhancedOptionsDialogProps) return;
    const { multiple, onSelect } = enhancedOptionsDialogProps;

    // Simply pass the selected item back to the parent
    onSelect(item);
    
    // Close dialog only if it's single select
    if (!multiple) {
      closeEnhancedOptionsDialog();
    }
  }, [enhancedOptionsDialogProps, closeEnhancedOptionsDialog]);

  const handleView = useCallback((item: CollectionElement) => {
    if (!enhancedOptionsDialogProps) return;
    const { componentType } = enhancedOptionsDialogProps;
    selectCardItem(componentType as CollectionElementString, item._id!);
  }, [enhancedOptionsDialogProps, selectCardItem]);

  const memoizedContent = useMemo(() => {
    if (!enhancedOptionsDialogProps) return null;
    const { EnhancedComponent, isInteractable, filters, selectedItems } = enhancedOptionsDialogProps;
    
    return (
      <EnhancedComponent
        mode="shortList"
        fetchAll={true}
        onInteraction={handleInteraction}
        onView={handleView}
        isInteractable={isInteractable}
        filters={filters}
        selectedItems={selectedItems}
      />
    );
  }, [enhancedOptionsDialogProps, handleInteraction, handleView]);

  if (!enhancedOptionsDialogProps) {
    return null;
  }

  const { title } = enhancedOptionsDialogProps;

  return (
    <Dialog
      open={isEnhancedOptionsDialogOpen}
      onClose={closeEnhancedOptionsDialog}
      maxWidth="sm"
      fullWidth
      sx={{ zIndex: enhancedOptionsDialogZIndex }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ minHeight: '400px', mt: 2 }}>
          {memoizedContent}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeEnhancedOptionsDialog} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedSelectOptionsDialog;