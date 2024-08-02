import React from 'react';
import AgentFlexibleView from './AgentFlexibleView';
import AgentListView from './AgentListView';
import AgentTableView from './AgentTableView';
import AgentCardView from './AgentCardView';
import AgentShortListView from './AgentShortListView';
import { AliceAgent } from '../../../../utils/AgentTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { AgentComponentProps } from '../../../../utils/AgentTypes';

type BaseAgentMode = BaseDbElementProps<AliceAgent>['mode'];
type ExtendedAgentMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedAgentMode = BaseAgentMode | ExtendedAgentMode;

interface EnhancedAgentProps extends Omit<AgentComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedAgentMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: AliceAgent) => void;
}

const EnhancedAgent: React.FC<EnhancedAgentProps> = (props) => {
  console.log('EnhancedAgent props:', props);
  const renderContent = (
    items: AliceAgent[] | null,
    item: AliceAgent | null,
    onChange: (newItem: Partial<AliceAgent>) => void,
    mode: BaseAgentMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: AgentComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
      onView: props.onView,
      handlePromptClick: props.handlePromptClick,
      handleModelClick: props.handleModelClick,
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
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedAgent;