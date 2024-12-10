import React from 'react';
import PromptFlexibleView from './PromptFlexibleView';
import PromptListView from './PromptListView';
import PromptTableView from './PromptTableView';
import PromptCardView from './PromptCardView';
import PromptShortListView from './PromptShortListView';
import { Prompt } from '../../../../types/PromptTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { PromptComponentProps } from '../../../../types/PromptTypes';
import Logger from '../../../../utils/Logger';

type BasePromptMode = BaseDbElementProps<Prompt>['mode'];
type ExtendedPromptMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedPromptMode = BasePromptMode | ExtendedPromptMode;

interface EnhancedPromptProps extends Omit<PromptComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedPromptMode;
  item?: Partial<Prompt> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: Prompt) => void;
  onDelete?: (deletedItem: Prompt) => Promise<void>;
}

const EnhancedPrompt: React.FC<EnhancedPromptProps> = (props) => {
  const renderContent = (
    items: Prompt[] | null,
    item: Prompt | null,
    onChange: (newItem: Partial<Prompt>) => void,
    mode: BasePromptMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: Prompt) => Promise<void>,
  ) => {
    Logger.debug('EnhancedPrompt', { items, item, mode });
    const commonProps: PromptComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onView: props.onView,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <PromptFlexibleView {...commonProps} />;
      case 'shortList':
        return <PromptShortListView {...commonProps} />;
      case 'list':
        return <PromptListView {...commonProps}/>;
      case 'table':
        return <PromptTableView {...commonProps} />;
      case 'card':
        return <PromptCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<Prompt>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<Prompt>
      collectionName="prompts"
      itemId={props.itemId}
      partialItem={props.item || undefined}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      onDelete={props.onDelete}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedPrompt;