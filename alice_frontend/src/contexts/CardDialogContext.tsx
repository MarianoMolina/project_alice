import React, { createContext, useContext, useState, useCallback } from 'react';
import { CollectionElementString, CollectionElement } from '../types/CollectionTypes';

interface DialogContextType {
  // Card Dialog
  selectCardItem: (itemType: CollectionElementString, itemId?: string, item?: CollectionElement) => void;
  selectedCardItem: CollectionElement | null;
  selectedCardItemType: CollectionElementString | null;
  
  // Flexible Dialog
  selectFlexibleItem: (itemType: CollectionElementString, mode: 'create' | 'edit', itemId?: string, item?: CollectionElement) => void;
  selectedFlexibleItem: CollectionElement | null;
  selectedFlexibleItemType: CollectionElementString | null;
  flexibleDialogMode: 'create' | 'edit' | null;
  
  // Common
  handleClose: () => void;
  isDialogOpen: boolean;
  activeDialog: 'card' | 'flexible' | null;
}

const CardDialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Card Dialog State
  const [selectedCardItem, setSelectedCardItem] = useState<CollectionElement | null>(null);
  const [selectedCardItemType, setSelectedCardItemType] = useState<CollectionElementString | null>(null);

  // Flexible Dialog State
  const [selectedFlexibleItem, setSelectedFlexibleItem] = useState<CollectionElement | null>(null);
  const [selectedFlexibleItemType, setSelectedFlexibleItemType] = useState<CollectionElementString | null>(null);
  const [flexibleDialogMode, setFlexibleDialogMode] = useState<'create' | 'edit' | null>(null);

  // Common State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'card' | 'flexible' | null>(null);

  const selectCardItem = useCallback((itemType: CollectionElementString, itemId?: string, item?: CollectionElement) => {
    setSelectedCardItemType(itemType);
    if (item) {
      setSelectedCardItem(item);
    } else if (itemId) {
      setSelectedCardItem({ _id: itemId } as CollectionElement);
    } else {
      setSelectedCardItem(null);
    }
    setIsDialogOpen(true);
    setActiveDialog('card');
  }, []);

  const selectFlexibleItem = useCallback((
    itemType: CollectionElementString, 
    mode: 'create' | 'edit', 
    itemId?: string, 
    item?: CollectionElement
  ) => {
    setSelectedFlexibleItemType(itemType);
    setFlexibleDialogMode(mode);
    if (mode === 'edit') {
      if (item) {
        setSelectedFlexibleItem(item);
      } else if (itemId) {
        setSelectedFlexibleItem({ _id: itemId } as CollectionElement);
      } else {
        throw new Error('Item or itemId must be provided for edit mode');
      }
    } else {
      setSelectedFlexibleItem(null);
    }
    setIsDialogOpen(true);
    setActiveDialog('flexible');
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCardItem(null);
    setSelectedCardItemType(null);
    setSelectedFlexibleItem(null);
    setSelectedFlexibleItemType(null);
    setFlexibleDialogMode(null);
    setIsDialogOpen(false);
    setActiveDialog(null);
  }, []);

  return (
    <CardDialogContext.Provider 
      value={{ 
        selectCardItem, 
        selectedCardItem, 
        selectedCardItemType, 
        selectFlexibleItem, 
        selectedFlexibleItem, 
        selectedFlexibleItemType, 
        flexibleDialogMode,
        handleClose, 
        isDialogOpen,
        activeDialog
      }}
    >
      {children}
    </CardDialogContext.Provider>
  );
};

export const useCardDialog = () => {
  const context = useContext(CardDialogContext);
  if (context === undefined) {
    throw new Error('useCardDialog must be used within a DialogProvider');
  }
  return context;
};