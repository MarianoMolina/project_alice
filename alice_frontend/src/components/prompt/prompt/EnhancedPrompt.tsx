import React from 'react';
import PromptFlexibleView from './PromptFlexibleView';
import PromptListView from './PromptListView';
import PromptTableView from './PromptTableView';
import PromptCardView from './PromptCardView';
import { Prompt } from '../../../utils/PromptTypes';
import BaseDbElement, { BaseDbElementProps } from '../../BaseDbElement';
import { PromptComponentProps } from '../../../utils/PromptTypes';

type BasePromptMode = BaseDbElementProps<Prompt>['mode'];
type ExtendedPromptMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedPromptMode = BasePromptMode | ExtendedPromptMode;

interface EnhancedPromptProps extends Omit<PromptComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedPromptMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: Prompt) => void;
}

const EnhancedPrompt: React.FC<EnhancedPromptProps> = (props) => {
  const renderContent = (
    items: Prompt[] | null,
    item: Prompt | null,
    onChange: (newItem: Partial<Prompt>) => void,
    mode: BasePromptMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: PromptComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
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
      case 'list':
      case 'shortList':
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
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedPrompt;