import React from 'react';
import EnhancedTableView, { Column } from '../../../common/enhanced_component/TableView';
import { ChatThread, ChatThreadComponentProps } from '../../../../types/ChatThreadTypes';

const ChatThreadTableView: React.FC<ChatThreadComponentProps> = ({
  items,
  item,
  isInteractable = false,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns: Column<ChatThread>[] = [
    {
      header: 'Chat Name',
      render: (chat: ChatThread) => chat.name || 'Thread (no name)',
      sortKey: 'name'
    },
    {
      header: 'Msg Count',
      render: (chat: ChatThread) => chat.messages.length || 0,
      sortKey: 'messages.length'
    }
  ];

  return (
    <EnhancedTableView<ChatThread>
      items={items as ChatThread[]}
      item={item as ChatThread}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Chat"
      viewTooltip="View Chat"
    />
  );
};

export default ChatThreadTableView;