import React from 'react';
import AgentFlexibleView from './AgentFlexibleViewNew';
import AgentListView from './AgentListView';
import AgentTableView from './AgentTableView';
import AgentCardView from './AgentCardView';
import AgentShortListView from './AgentShortListView';
import { AliceAgent } from '../../../../types/AgentTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { AgentComponentProps } from '../../../../types/AgentTypes';

type BaseAgentMode = BaseDbElementProps<AliceAgent>['mode'];
type ExtendedAgentMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedAgentMode = BaseAgentMode | ExtendedAgentMode;

interface EnhancedAgentProps extends Omit<AgentComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedAgentMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: AliceAgent) => void;
  onDelete?: (deletedItem: AliceAgent) => Promise<void>;
}

const EnhancedAgent: React.FC<EnhancedAgentProps> = (props) => {
  const renderContent = (
    items: AliceAgent[] | null,
    item: AliceAgent | null,
    onChange: (newItem: Partial<AliceAgent>) => void,
    mode: BaseAgentMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: AliceAgent) => Promise<void>,
  ) => {
    const commonProps: AgentComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
      onView: props.onView,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <AgentFlexibleView {...commonProps} />;
      case 'shortList':
        return <AgentShortListView {...commonProps} />;
      case 'list':
        return <AgentListView {...commonProps}/>;
      case 'table':
        return <AgentTableView {...commonProps} />;
      case 'card':
        return <AgentCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<AliceAgent>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<AliceAgent>
      collectionName="agents"
      itemId={props.itemId}
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

export default EnhancedAgent;