import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DialogOptions {
  title: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  dialogOptions: DialogOptions | null;
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

  const openDialog = (options: DialogOptions) => {
    setDialogOptions(options);
  };

  const closeDialog = () => {
    setDialogOptions(null);
  };

  return (
    <DialogContext.Provider value={{ dialogOptions, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};