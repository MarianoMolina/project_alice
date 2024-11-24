import React from 'react';
import ChatFlexibleView from './ChatFlexibleView';
import ChatListView from './ChatListView';
import ChatTableView from './ChatTableView';
import ChatCardView from './ChatCardView';
import ChatShortListView from './ChatShortListView';
import { AliceChat } from '../../../../types/ChatTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { ChatComponentProps } from '../../../../types/ChatTypes';
import ChatMessagesFullView from './ChatMessagesFullView';

type BaseChatMode = BaseDbElementProps<AliceChat>['mode'];
type ExtendedChatMode = 'list' | 'shortList' | 'card' | 'full' | 'table';
type EnhancedChatMode = BaseChatMode | ExtendedChatMode;

interface EnhancedChatProps extends Omit<ChatComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode' | 'handleDelete'> {
  mode: EnhancedChatMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: AliceChat) => Promise<void>;
  onDelete?: (deletedItem: AliceChat) => Promise<void>;
}

const EnhancedChat: React.FC<EnhancedChatProps> = (props) => {
  const renderContent = (
    items: AliceChat[] | null,
    item: AliceChat | null,
    onChange: (newItem: Partial<AliceChat>) => void,
    mode: BaseChatMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: AliceChat) => Promise<void>,
  ) => {
    const commonProps: ChatComponentProps = {
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
      showRegenerate: props.showRegenerate,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <ChatFlexibleView {...commonProps} />;
      case 'shortList':
        return <ChatShortListView {...commonProps} />;
      case 'list':
        return <ChatListView {...commonProps}/>;
      case 'table':
        return <ChatTableView {...commonProps} />;
      case 'card':
        return <ChatCardView {...commonProps} />;
      case 'full':
        return <ChatMessagesFullView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<AliceChat>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<AliceChat>
      collectionName="chats"
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

export default EnhancedChat;