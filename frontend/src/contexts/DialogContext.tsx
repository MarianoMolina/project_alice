import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CollectionElementString, CollectionElement, CollectionName, CollectionPopulatedElement } from '../types/CollectionTypes';
import { Prompt } from '../types/PromptTypes';
import { ApiProvider } from './ApiContext';
import { PopulatedTask } from '../types/TaskTypes';
import Logger from '../utils/Logger';
import EnhancedCardDialog from '../components/enhanced/common/enhanced_dialogs/EnhancedCardDialog';
import EnhancedFlexibleDialog from '../components/enhanced/common/enhanced_dialogs/EnhancedFlexibleDialog';
import PromptParsedDialog from '../components/enhanced/common/enhanced_dialogs/PromptParsedDialog';
import EnhancedSelectDialog from '../components/enhanced/common/enhanced_dialogs/EnhancedSelectDialog';
import DialogComponent from '../components/ui/dialog/DialogCustom';
import FlowChartDialog from '../components/enhanced/common/enhanced_dialogs/TaskFlowchartDialog';
import EnhancedSelectOptionsDialog from '../components/enhanced/common/enhanced_dialogs/EnhancedSelectOptionsDialog';

// Message Dialog Types
interface DialogButton {
  text: string;
  action: () => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
}

interface DialogOptions {
  title: string;
  content: string;
  buttons: DialogButton[];
}

interface DialogContextType {
  // Message Dialog
  dialogOptions: DialogOptions | null;
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
  messageDialogZIndex: number;

  // Card Dialog
  selectCardItem: (itemType: CollectionElementString, itemId?: string, item?: CollectionPopulatedElement) => void;
  selectedCardItem: CollectionPopulatedElement | null;
  selectedCardItemType: CollectionElementString | null;
  isCardDialogOpen: boolean;
  closeCardDialog: () => void;
  cardDialogZIndex: number;

  // Flexible Dialog
  selectFlexibleItem: (itemType: CollectionElementString, mode: 'create' | 'edit', itemId?: string, item?: CollectionPopulatedElement) => void;
  selectedFlexibleItem: CollectionPopulatedElement | null;
  selectedFlexibleItemType: CollectionElementString | null;
  flexibleDialogMode: 'create' | 'edit' | null;
  isFlexibleDialogOpen: boolean;
  closeFlexibleDialog: () => void;
  flexibleDialogZIndex: number;

  // Prompt Parsed Dialog
  selectPromptParsedDialog: (
    prompt: Prompt,
    systemPrompt?: Prompt,
    promptInputs?: Record<string, any>,
    systemPromptInputs?: Record<string, any>,
    onPromptInputsChange?: (inputs: Record<string, any>) => void,
    onSystemPromptInputsChange?: (inputs: Record<string, any>) => void
  ) => void;
  selectedPromptItem: Prompt | undefined;
  selectedSystemPromptItem: Prompt | undefined;
  promptInputs: Record<string, any> | undefined;
  systemPromptInputs: Record<string, any> | undefined;
  onPromptInputsChange?: (inputs: Record<string, any>) => void;
  onSystemPromptInputsChange?: (inputs: Record<string, any>) => void;
  isPromptDialogOpen: boolean;
  closePromptDialog: () => void;
  promptDialogZIndex: number;

  // Select Dialog
  selectDialog: <T extends CollectionElement | CollectionPopulatedElement>(
    componentType: CollectionName,
    EnhancedView: React.ComponentType<any>,
    title: string,
    onSelect: (item: T) => void | Promise<void>,
    selectedItems?: T[],
    multiple?: boolean,
    filters?: Record<string, any>
  ) => void;
  selectedComponentType: CollectionName | undefined;
  selectedEnhancedView: React.ComponentType<any> | undefined;
  selectedItems: CollectionElement[] | CollectionPopulatedElement[];
  onSelectCallback?: (item: CollectionElement | CollectionPopulatedElement) => void | Promise<void>;
  selectDialogTitle: string | undefined;
  selectDialogFilters: Record<string, any> | undefined;
  selectDialogMultiple: boolean;
  isSelectDialogOpen: boolean;
  closeSelectDialog: () => void;
  selectDialogZIndex: number;

  // Enhanced Select options Dialog
  selectEnhancedOptions: <T extends CollectionElement | CollectionPopulatedElement>(
    componentType: CollectionName,
    EnhancedComponent: React.ComponentType<any>,
    title: string,
    selectedItems: T[],
    onSelect: (selectedItem: T) => void,
    isInteractable: boolean,
    multiple: boolean,
    filters?: Record<string, any>
  ) => void;
  isEnhancedOptionsDialogOpen: boolean;
  closeEnhancedOptionsDialog: () => void;
  updateEnhancedOptionsSelectedItems: <T extends CollectionElement | CollectionPopulatedElement>(
    newSelectedItems: T[]
  ) => void;
  enhancedOptionsDialogProps: {
    componentType: CollectionName;
    EnhancedComponent: React.ComponentType<any>;
    title: string;
    selectedItems: (CollectionElement | CollectionPopulatedElement)[];
    onSelect: (selectedItems: CollectionElement | CollectionPopulatedElement) => void;
    isInteractable: boolean;
    multiple: boolean;
    filters?: Record<string, any>;
  } | null;
  enhancedOptionsDialogZIndex: number;

  // Flowchart Dialog
  selectTaskFlowchartItem: (item: PopulatedTask) => void;
  selectedTaskFlowchartItem: PopulatedTask | null;
  isTaskFlowchartDialogOpen: boolean;
  closeTaskFlowchartDialog: () => void;
  taskFlowchartDialogZIndex: number;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Message Dialog State
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);

  // Dialog open timestamps for z-index management
  const [cardDialogOpenedAt, setCardDialogOpenedAt] = useState<number | null>(null);
  const [flexibleDialogOpenedAt, setFlexibleDialogOpenedAt] = useState<number | null>(null);
  const [promptDialogOpenedAt, setPromptDialogOpenedAt] = useState<number | null>(null);
  const [selectDialogOpenedAt, setSelectDialogOpenedAt] = useState<number | null>(null);
  const [taskFlowchartDialogOpenedAt, setTaskFlowchartDialogOpenedAt] = useState<number | null>(null);

  // Card Dialog State
  const [selectedCardItem, setSelectedCardItem] = useState<CollectionPopulatedElement | null>(null);
  const [selectedCardItemType, setSelectedCardItemType] = useState<CollectionElementString | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);

  // Flexible Dialog State
  const [selectedFlexibleItem, setSelectedFlexibleItem] = useState<CollectionPopulatedElement | null>(null);
  const [selectedFlexibleItemType, setSelectedFlexibleItemType] = useState<CollectionElementString | null>(null);
  const [flexibleDialogMode, setFlexibleDialogMode] = useState<'create' | 'edit' | null>(null);
  const [isFlexibleDialogOpen, setIsFlexibleDialogOpen] = useState(false);

  // Prompt Dialog State
  const [selectedPromptItem, setSelectedPromptItem] = useState<Prompt | undefined>(undefined);
  const [selectedSystemPromptItem, setSelectedSystemPromptItem] = useState<Prompt | undefined>(undefined);
  const [promptInputs, setPromptInputs] = useState<Record<string, any> | undefined>(undefined);
  const [systemPromptInputs, setSystemPromptInputs] = useState<Record<string, any> | undefined>(undefined);
  const [onPromptInputsChange, setOnPromptInputsChange] = useState<((inputs: Record<string, any>) => void) | undefined>();
  const [onSystemPromptInputsChange, setOnSystemPromptInputsChange] = useState<((inputs: Record<string, any>) => void) | undefined>();
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);

  // Select Dialog State
  const [selectedComponentType, setSelectedComponentType] = useState<CollectionName | undefined>(undefined);
  const [selectedEnhancedView, setSelectedEnhancedView] = useState<React.ComponentType<any> | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<CollectionElement[] | CollectionPopulatedElement[]>([]);
  const [onSelectCallback, setOnSelectCallback] = useState<((item: CollectionElement | CollectionPopulatedElement) => void | Promise<void>) | undefined>();
  const [selectDialogTitle, setSelectDialogTitle] = useState<string | undefined>(undefined);
  const [selectDialogFilters, setSelectDialogFilters] = useState<Record<string, any> | undefined>(undefined);
  const [selectDialogMultiple, setSelectDialogMultiple] = useState<boolean>(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);

  // Enhanced Select Options Dialog State
  const [enhancedOptionsDialogOpenedAt, setEnhancedOptionsDialogOpenedAt] = useState<number | null>(null);

  // Add enhanced options dialog state
  const [enhancedOptionsDialogProps, setEnhancedOptionsDialogProps] = useState<{
    componentType: CollectionName;
    EnhancedComponent: React.ComponentType<any>;
    title: string;
    selectedItems: (CollectionElement | CollectionPopulatedElement)[];
    onSelect: (selectedItems: CollectionElement | CollectionPopulatedElement) => void;
    isInteractable: boolean;
    multiple: boolean;
    filters?: Record<string, any>;
  } | null>(null);
  const [isEnhancedOptionsDialogOpen, setIsEnhancedOptionsDialogOpen] = useState(false);


  // Flowchart Dialog State
  const [selectedTaskFlowchartItem, setSelectedTaskFlowchartItem] = useState<PopulatedTask | null>(null);
  const [isTaskFlowchartDialogOpen, setIsTaskFlowchartDialogOpen] = useState(false);

  // Message Dialog Actions
  const openDialog = useCallback((options: DialogOptions) => {
    setDialogOptions(options);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOptions(null);
  }, []);

  // Z-index calculations
  const {
    cardDialogZIndex,
    flexibleDialogZIndex,
    promptDialogZIndex,
    selectDialogZIndex,
    taskFlowchartDialogZIndex,
    messageDialogZIndex,
    enhancedOptionsDialogZIndex
  } = useMemo(() => {
    const openTimestamps = [
      { type: 'card', timestamp: cardDialogOpenedAt },
      { type: 'flexible', timestamp: flexibleDialogOpenedAt },
      { type: 'prompt', timestamp: promptDialogOpenedAt },
      { type: 'select', timestamp: selectDialogOpenedAt },
      { type: 'taskFlowchart', timestamp: taskFlowchartDialogOpenedAt },
      { type: 'enhancedOptions', timestamp: enhancedOptionsDialogOpenedAt },
      // Add message dialog to z-index calculation if it's open
      ...(dialogOptions ? [{ type: 'message', timestamp: Date.now() }] : [])
    ].filter(item => item.timestamp !== null);

    const latestDialog = openTimestamps.length > 0
      ? openTimestamps.reduce((latest, current) =>
        current.timestamp! > latest.timestamp! ? current : latest
      )
      : null;

    return {
      cardDialogZIndex: latestDialog?.type === 'card' ? 1300 : 1100,
      flexibleDialogZIndex: latestDialog?.type === 'flexible' ? 1300 : 1100,
      promptDialogZIndex: latestDialog?.type === 'prompt' ? 1300 : 1100,
      selectDialogZIndex: latestDialog?.type === 'select' ? 1300 : 1100,
      taskFlowchartDialogZIndex: latestDialog?.type === 'taskFlowchart' ? 1300 : 1100,
      messageDialogZIndex: latestDialog?.type === 'message' ? 1300 : 1100,
      enhancedOptionsDialogZIndex: latestDialog?.type === 'enhancedOptions' ? 1300 : 1100
    };
  }, [
    cardDialogOpenedAt,
    flexibleDialogOpenedAt,
    promptDialogOpenedAt,
    selectDialogOpenedAt,
    taskFlowchartDialogOpenedAt,
    enhancedOptionsDialogOpenedAt,
    dialogOptions
  ]);

  const selectCardItem = useCallback((itemType: CollectionElementString, itemId?: string, item?: CollectionPopulatedElement) => {
    Logger.debug('DialogContext selectCardItem', { itemType, itemId, item });
    setSelectedCardItemType(itemType);
    if (item) {
      setSelectedCardItem(item);
    } else if (itemId) {
      setSelectedCardItem({ _id: itemId } as CollectionPopulatedElement);
    } else {
      setSelectedCardItem(null);
    }
    setIsCardDialogOpen(true);
    setCardDialogOpenedAt(Date.now());
  }, []);

  const selectFlexibleItem = useCallback((
    itemType: CollectionElementString,
    mode: 'create' | 'edit',
    itemId?: string,
    item?: CollectionPopulatedElement
  ) => {
    setSelectedFlexibleItemType(itemType);
    setFlexibleDialogMode(mode);
    if (mode === 'edit') {
      if (item) {
        setSelectedFlexibleItem(item);
      } else if (itemId) {
        setSelectedFlexibleItem({ _id: itemId } as CollectionPopulatedElement);
      } else {
        throw new Error('Item or itemId must be provided for edit mode');
      }
    } else {
      if (item) {
        Logger.debug('DialogContext selectFlexibleItem', { itemType, item });
        setSelectedFlexibleItem(item);
      } else {
        setSelectedFlexibleItem(null);
      }
    }
    setIsFlexibleDialogOpen(true);
    setFlexibleDialogOpenedAt(Date.now());
  }, []);

  const selectPromptParsedDialog = useCallback((
    prompt: Prompt,
    systemPrompt?: Prompt,
    initialPromptInputs?: Record<string, any>,
    initialSystemPromptInputs?: Record<string, any>,
    promptInputsChange?: (inputs: Record<string, any>) => void,
    systemPromptInputsChange?: (inputs: Record<string, any>) => void
  ) => {
    setSelectedPromptItem(prompt);
    setSelectedSystemPromptItem(systemPrompt);
    setPromptInputs(initialPromptInputs);
    setSystemPromptInputs(initialSystemPromptInputs);
    setOnPromptInputsChange(() => promptInputsChange);
    setOnSystemPromptInputsChange(() => systemPromptInputsChange);
    setIsPromptDialogOpen(true);
    setPromptDialogOpenedAt(Date.now());
  }, []);

  const selectDialog = useCallback(<T extends CollectionElement | CollectionPopulatedElement>(
    componentType: CollectionName,
    EnhancedView: React.ComponentType<any>,
    title: string,
    onSelect: (item: T) => void | Promise<void>,
    selectedItems: T[] = [],
    multiple = false,
    filters?: Record<string, any>
  ) => {
    setSelectedComponentType(componentType);
    setSelectedEnhancedView(() => EnhancedView);
    setSelectDialogTitle(title);
    setOnSelectCallback(() => onSelect as (item: CollectionElement | CollectionPopulatedElement) => void | Promise<void>);
    setSelectedItems(selectedItems as CollectionElement[]);
    setSelectDialogMultiple(multiple);
    setSelectDialogFilters(filters);
    setIsSelectDialogOpen(true);
    setSelectDialogOpenedAt(Date.now());
  }, []);
  const selectEnhancedOptions = useCallback(<T extends CollectionElement | CollectionPopulatedElement>(
    componentType: CollectionName,
    EnhancedComponent: React.ComponentType<any>,
    title: string,
    selectedItems: T[],
    onSelect: (selectedItem: T) => void,
    isInteractable: boolean,
    multiple: boolean,
    filters?: Record<string, any>
  ) => {
    setEnhancedOptionsDialogProps({
      componentType,
      EnhancedComponent,
      title,
      selectedItems,
      onSelect: onSelect as (selectedItems: CollectionElement | CollectionPopulatedElement) => void,
      isInteractable,
      multiple,
      filters
    });
    setIsEnhancedOptionsDialogOpen(true);
    setEnhancedOptionsDialogOpenedAt(Date.now());
  }, []);

  const updateEnhancedOptionsSelectedItems = useCallback(<T extends CollectionElement | CollectionPopulatedElement>(
    newSelectedItems: T[]
  ) => {
    setEnhancedOptionsDialogProps(prev => {
      if (!prev) return null;
      return {
        ...prev,
        selectedItems: newSelectedItems
      };
    });
  }, []);
  const selectTaskFlowchartItem = useCallback((item: PopulatedTask) => {
    setSelectedTaskFlowchartItem(item);
    setIsTaskFlowchartDialogOpen(true);
    setTaskFlowchartDialogOpenedAt(Date.now());
  }, []);

  const closeCardDialog = useCallback(() => {
    setSelectedCardItem(null);
    setSelectedCardItemType(null);
    setIsCardDialogOpen(false);
    setCardDialogOpenedAt(null);
  }, []);

  const closeFlexibleDialog = useCallback(() => {
    setSelectedFlexibleItem(null);
    setSelectedFlexibleItemType(null);
    setFlexibleDialogMode(null);
    setIsFlexibleDialogOpen(false);
    setFlexibleDialogOpenedAt(null);
  }, []);

  const closePromptDialog = useCallback(() => {
    setSelectedPromptItem(undefined);
    setSelectedSystemPromptItem(undefined);
    setPromptInputs(undefined);
    setSystemPromptInputs(undefined);
    setOnPromptInputsChange(undefined);
    setOnSystemPromptInputsChange(undefined);
    setIsPromptDialogOpen(false);
    setPromptDialogOpenedAt(null);
  }, []);

  const closeSelectDialog = useCallback(() => {
    setSelectedComponentType(undefined);
    setSelectedEnhancedView(undefined);
    setSelectedItems([]);
    setOnSelectCallback(undefined);
    setSelectDialogTitle(undefined);
    setSelectDialogFilters(undefined);
    setSelectDialogMultiple(false);
    setIsSelectDialogOpen(false);
    setSelectDialogOpenedAt(null);
  }, []);

  const closeEnhancedOptionsDialog = useCallback(() => {
    setEnhancedOptionsDialogProps(null);
    setIsEnhancedOptionsDialogOpen(false);
    setEnhancedOptionsDialogOpenedAt(null);
  }, []);

  const closeTaskFlowchartDialog = useCallback(() => {
    setSelectedTaskFlowchartItem(null);
    setIsTaskFlowchartDialogOpen(false);
    setTaskFlowchartDialogOpenedAt(null);
  }, []);

  return (
    <DialogContext.Provider
      value={{
        // Message Dialog
        dialogOptions,
        openDialog,
        closeDialog,
        messageDialogZIndex,

        // Card Dialog
        selectCardItem,
        selectedCardItem,
        selectedCardItemType,
        isCardDialogOpen,
        closeCardDialog,
        cardDialogZIndex,

        // Flexible Dialog
        selectFlexibleItem,
        selectedFlexibleItem,
        selectedFlexibleItemType,
        flexibleDialogMode,
        isFlexibleDialogOpen,
        closeFlexibleDialog,
        flexibleDialogZIndex,

        // Prompt Parsed Dialog
        selectPromptParsedDialog,
        selectedPromptItem,
        selectedSystemPromptItem,
        promptInputs,
        systemPromptInputs,
        onPromptInputsChange,
        onSystemPromptInputsChange,
        isPromptDialogOpen,
        closePromptDialog,
        promptDialogZIndex,

        // Select Dialog
        selectDialog,
        selectedComponentType,
        selectedEnhancedView,
        updateEnhancedOptionsSelectedItems,
        selectedItems,
        onSelectCallback,
        selectDialogTitle,
        selectDialogFilters,
        selectDialogMultiple,
        isSelectDialogOpen,
        closeSelectDialog,
        selectDialogZIndex,

        // Select Options Dialog
        selectEnhancedOptions,
        enhancedOptionsDialogProps,
        isEnhancedOptionsDialogOpen,
        closeEnhancedOptionsDialog,
        enhancedOptionsDialogZIndex,

        // Flowchart Dialog
        selectTaskFlowchartItem,
        selectedTaskFlowchartItem,
        isTaskFlowchartDialogOpen,
        closeTaskFlowchartDialog,
        taskFlowchartDialogZIndex
      }}
    >
      <ApiProvider>
        <DialogComponent />
        <EnhancedCardDialog />
        <EnhancedFlexibleDialog />
        <PromptParsedDialog />
        <EnhancedSelectDialog />
        <EnhancedSelectOptionsDialog />
        <FlowChartDialog />
        {children}
      </ApiProvider>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};