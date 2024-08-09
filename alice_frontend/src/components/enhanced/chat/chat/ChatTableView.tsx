import React from 'react';
import { ChatComponentProps, AliceChat } from '../../../../types/ChatTypes';
import EnhancedTableView, { Column } from '../../common/enhanced_component/TableView';

const ChatTableView: React.FC<ChatComponentProps> = ({
  items,
  item,
  isInteractable = false,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns: Column<AliceChat>[] = [
    {
      header: 'Chat Name',
      render: (chat: AliceChat) => chat.name,
      sortKey: 'name'
    },
    {
      header: 'Agent',
      render: (chat: AliceChat) => chat.alice_agent?.name || 'N/A',
      // We can't directly sort by nested properties, so we'll omit sortKey here
    },
    {
      header: 'Created At',
      render: (chat: AliceChat) => new Date(chat.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<AliceChat>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={isInteractable ? onInteraction : undefined}
      showHeaders={showHeaders}
      interactionTooltip="Add Chat"
      viewTooltip="View Chat"
    />
  );
};

export default ChatTableView;