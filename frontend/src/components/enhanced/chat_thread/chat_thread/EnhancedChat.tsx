import React from 'react';
import BaseDbElement, { BaseDbElementProps } from '../../../common/enhanced_component/BaseDbElement';
import { ChatThread, ChatThreadComponentProps, PopulatedChatThread } from '../../../../types/ChatThreadTypes';
import ChatThreadShortListView from './ChatThreadShortListView';
import ChatThreadListView from './ChatThreadListView';
import ChatThreadTableView from './ChatThreadTableView';
import ChatThreadCardView from './ChatThreadCardView';
import ChatThreadFlexibleView from './ChatThreadFlexibleView';

type BaseChatMode = BaseDbElementProps<PopulatedChatThread>['mode'];
type ExtendedChatMode = 'list' | 'shortList' | 'card' | 'full' | 'table';
type EnhancedChatThreadMode = BaseChatMode | ExtendedChatMode;

interface EnhancedChatThreadProps extends Omit<ChatThreadComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode' | 'handleDelete'> {
  mode: EnhancedChatThreadMode;
  item?: Partial<ChatThread | PopulatedChatThread> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: ChatThread | PopulatedChatThread) => Promise<void>;
  onDelete?: (deletedItem: ChatThread | PopulatedChatThread) => Promise<void>;
}

const EnhancedChatThread: React.FC<EnhancedChatThreadProps> = (props) => {
  const renderContent = (
    items: (ChatThread | PopulatedChatThread)[] | null,
    item: ChatThread | PopulatedChatThread | null,
    onChange: (newItem: Partial<ChatThread | PopulatedChatThread>) => void,
    mode: BaseChatMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: ChatThread | PopulatedChatThread) => Promise<void>,
  ) => {
    const commonProps: ChatThreadComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      onView: props.onView,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <ChatThreadFlexibleView {...commonProps} />;
      case 'shortList':
        return <ChatThreadShortListView {...commonProps} />;
      case 'list':
        return <ChatThreadListView {...commonProps} />;
      case 'table':
        return <ChatThreadTableView {...commonProps} />;
      case 'card':
        return <ChatThreadCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<ChatThread>['mode'] =
    props.mode === 'create' ? 'create' :
      props.mode === 'edit' ? 'edit' : 'view';
  return (
    <BaseDbElement<ChatThread | PopulatedChatThread>
      collectionName="chatthreads"
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

export default EnhancedChatThread;