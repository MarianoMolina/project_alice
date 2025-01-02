import React from 'react';
import { Box, Dialog, DialogTitle } from '@mui/material';
import { CollectionElement } from '../../../../types/CollectionTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import { useApi } from '../../../../contexts/ApiContext';
import { useDialog } from '../../../../contexts/DialogContext';
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
        selectDialogZIndex
    } = useDialog();

    if (!selectedComponentType || !selectedEnhancedView || !selectDialogTitle || !onSelectCallback) {
        return null;
    }

    const handleSelect = async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            try {
                // TODO: This should be able to select multiple items no?
                Logger.debug('EnhancedSelectDialog - handleSelect', { selectedIds });
                const selectedItem = await fetchItem(selectedComponentType, selectedIds[0]) as CollectionElement;
                await onSelectCallback(selectedItem);
                closeSelectDialog();
            } catch (error) {
                Logger.error('EnhancedSelectDialog - Error selecting item:', error);
            }
        }
    };

    return (
        <Dialog
            open={isSelectDialogOpen}
            onClose={closeSelectDialog}
            maxWidth="md"
            fullWidth
            sx={{ zIndex: selectDialogZIndex }}
        >
            <DialogTitle>{selectDialogTitle}</DialogTitle>
            <Box className="p-4">
                <EnhancedSelect
                    componentType={selectedComponentType}
                    EnhancedView={selectedEnhancedView}
                    selectedItems={selectedItems as CollectionElement[]}
                    onSelect={handleSelect}
                    isInteractable={true}
                    multiple={selectDialogMultiple}
                    label={selectDialogTitle}
                    activeAccordion={null}
                    onAccordionToggle={() => {}}
                    accordionEntityName={selectedComponentType}
                    filters={selectDialogFilters}
                />
            </Box>
        </Dialog>
    );
};

export default EnhancedSelectDialog;