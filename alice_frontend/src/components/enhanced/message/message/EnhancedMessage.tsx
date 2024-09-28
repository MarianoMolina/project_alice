import React from 'react';
import MessageFlexibleView from './MessageFlexibleView';
import MessageListView from './MessageListView';
import MessageTableView from './MessageTableView';
import MessageCardView from './MessageCardView';
import MessageShortListView from './MessageShortListView';
import { MessageType } from '../../../../types/MessageTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { MessageComponentProps } from '../../../../types/MessageTypes';

type BaseMessageMode = BaseDbElementProps<MessageType>['mode'];
type ExtendedMessageMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedMessageMode = BaseMessageMode | ExtendedMessageMode;

interface EnhancedMessageProps extends Omit<MessageComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedMessageMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: MessageType) => void;
}

const EnhancedMessage: React.FC<EnhancedMessageProps> = (props) => {
  const renderContent = (
    items: MessageType[] | null,
    item: MessageType | null,
    onChange: (newItem: Partial<MessageType>) => void,
    mode: BaseMessageMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: MessageComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      onView: props.onView,
      showHeaders: props.showHeaders,
      chatId: props.chatId,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <MessageFlexibleView {...commonProps} />;
      case 'shortList':
        return <MessageShortListView {...commonProps} />;
      case 'list':
        return <MessageListView {...commonProps}/>;
      case 'table':
        return <MessageTableView {...commonProps} />;
      case 'card':
        return <MessageCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<MessageType>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<MessageType>
      collectionName="messages"
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

export default EnhancedMessage;