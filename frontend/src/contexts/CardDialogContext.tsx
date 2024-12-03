import React, { createContext, useContext, useState, useCallback } from 'react';
import { CollectionElementString, CollectionElement, CollectionName } from '../types/CollectionTypes';
import { Prompt } from '../types/PromptTypes';
import Logger from '../utils/Logger';
import { ApiProvider } from './ApiContext';
import EnhancedCardDialog from '../components/enhanced/common/enhanced_card_dialog/EnhancedCardDialog';
import EnhancedFlexibleDialog from '../components/enhanced/common/enhanced_card_dialog/EnhancedFlexibleDialog';
import PromptParsedDialog from '../components/enhanced/common/enhanced_card_dialog/PromptParsedDialog';
import EnhancedSelectDialog from '../components/enhanced/common/enhanced_card_dialog/EnhancedSelectDialog';
import { AliceTask } from '../types/TaskTypes';

interface DialogContextType {
  // Card Dialog
  selectCardItem: (itemType: CollectionElementString, itemId?: string, item?: CollectionElement) => void;
  selectedCardItem: CollectionElement | null;
  selectedCardItemType: CollectionElementString | null;
  isCardDialogOpen: boolean;
  closeCardDialog: () => void;

  // Flexible Dialog
  selectFlexibleItem: (itemType: CollectionElementString, mode: 'create' | 'edit', itemId?: string, item?: CollectionElement) => void;
  selectedFlexibleItem: CollectionElement | null;
  selectedFlexibleItemType: CollectionElementString | null;
  flexibleDialogMode: 'create' | 'edit' | null;
  isFlexibleDialogOpen: boolean;
  closeFlexibleDialog: () => void;

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

  // Select Dialog
  selectDialog: <T extends CollectionElement>(
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
  selectedItems: CollectionElement[];
  onSelectCallback?: (item: CollectionElement) => void | Promise<void>;
  selectDialogTitle: string | undefined;
  selectDialogFilters: Record<string, any> | undefined;
  selectDialogMultiple: boolean;
  isSelectDialogOpen: boolean;
  closeSelectDialog: () => void;

  // Flowchart Dialog
  selectTaskFlowchartItem: (itemId: string) => void;
  selectedTaskFlowchartItem: AliceTask | null;
  isTaskFlowchartDialogOpen: boolean;
  closeTaskFlowchartDialog: () => void;
}

const CardDialogContext = createContext<DialogContextType | undefined>(undefined);

export const CardDialogProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Card Dialog State
  const [selectedCardItem, setSelectedCardItem] = useState<CollectionElement | null>(null);
  const [selectedCardItemType, setSelectedCardItemType] = useState<CollectionElementString | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);

  // Flexible Dialog State
  const [selectedFlexibleItem, setSelectedFlexibleItem] = useState<CollectionElement | null>(null);
  const [selectedFlexibleItemType, setSelectedFlexibleItemType] = useState<CollectionElementString | null>(null);
  const [flexibleDialogMode, setFlexibleDialogMode] = useState<'create' | 'edit' | null>(null);
  const [isFlexibleDialogOpen, setIsFlexibleDialogOpen] = useState(false);

  // Prompt Parsed Dialog State
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
  const [selectedItems, setSelectedItems] = useState<CollectionElement[]>([]);
  const [onSelectCallback, setOnSelectCallback] = useState<((item: CollectionElement) => void | Promise<void>) | undefined>();
  const [selectDialogTitle, setSelectDialogTitle] = useState<string | undefined>(undefined);
  const [selectDialogFilters, setSelectDialogFilters] = useState<Record<string, any> | undefined>(undefined);
  const [selectDialogMultiple, setSelectDialogMultiple] = useState<boolean>(false);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);

  // Flowchart Dialog State
  const [selectedTaskFlowchartItem, setSelectedTaskFlowchartItem] = useState<AliceTask | null>(null);
  const [isTaskFlowchartDialogOpen, setIsTaskFlowchartDialogOpen] = useState(false);

  const closeCardDialog = useCallback(() => {
    setSelectedCardItem(null);
    setSelectedCardItemType(null);
    setIsCardDialogOpen(false);
  }, []);

  const closeFlexibleDialog = useCallback(() => {
    setSelectedFlexibleItem(null);
    setSelectedFlexibleItemType(null);
    setFlexibleDialogMode(null);
    setIsFlexibleDialogOpen(false);
  }, []);

  const closePromptDialog = useCallback(() => {
    setSelectedPromptItem(undefined);
    setSelectedSystemPromptItem(undefined);
    setPromptInputs(undefined);
    setSystemPromptInputs(undefined);
    setOnPromptInputsChange(undefined);
    setOnSystemPromptInputsChange(undefined);
    setIsPromptDialogOpen(false);
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
  }, []);

  const selectCardItem = useCallback((itemType: CollectionElementString, itemId?: string, item?: CollectionElement) => {
    Logger.debug('CardDialogContext', { itemType, itemId, item });
    setSelectedCardItemType(itemType);
    if (item) {
      setSelectedCardItem(item);
    } else if (itemId) {
      setSelectedCardItem({ _id: itemId } as CollectionElement);
    } else {
      setSelectedCardItem(null);
    }
    setIsCardDialogOpen(true);
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
    setIsFlexibleDialogOpen(true);
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
  }, []);

  const selectDialog = useCallback(<T extends CollectionElement>(
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
    setOnSelectCallback(() => onSelect as (item: CollectionElement) => void | Promise<void>);
    setSelectedItems(selectedItems as CollectionElement[]);
    setSelectDialogMultiple(multiple);
    setSelectDialogFilters(filters);
    setIsSelectDialogOpen(true);
  }, []);

  const selectTaskFlowchartItem = useCallback((itemId: string) => {
    setSelectedTaskFlowchartItem(null);
    setIsTaskFlowchartDialogOpen(true);
  }, []);

  const closeTaskFlowchartDialog = useCallback(() => {
    setSelectedTaskFlowchartItem(null);
    setIsTaskFlowchartDialogOpen(false);
  }, []);

  return (
    <CardDialogContext.Provider
      value={{
        // Card Dialog
        selectCardItem,
        selectedCardItem,
        selectedCardItemType,
        isCardDialogOpen,
        closeCardDialog,

        // Flexible Dialog
        selectFlexibleItem,
        selectedFlexibleItem,
        selectedFlexibleItemType,
        flexibleDialogMode,
        isFlexibleDialogOpen,
        closeFlexibleDialog,

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

        // Select Dialog
        selectDialog,
        selectedComponentType,
        selectedEnhancedView,
        selectedItems,
        onSelectCallback,
        selectDialogTitle,
        selectDialogFilters,
        selectDialogMultiple,
        isSelectDialogOpen,
        closeSelectDialog,

        // Flowchart Dialog
        selectTaskFlowchartItem,
        selectedTaskFlowchartItem,
        isTaskFlowchartDialogOpen,
        closeTaskFlowchartDialog        
      }}
    >
      <ApiProvider>
        <EnhancedCardDialog />
        <EnhancedFlexibleDialog />
        <PromptParsedDialog />
        <EnhancedSelectDialog />
        {children}
      </ApiProvider>
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