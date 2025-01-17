import React from 'react';
import { ChatComponentProps, AliceChat } from '../../../../types/ChatTypes';
import EnhancedTableView, { Column } from '../../../common/enhanced_component/TableView';

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
      header: 'Msg Count',
      render: (chat: AliceChat) => chat.threads?.length || 0,
      sortKey: 'messages.length'
    }
  ];

  return (
    <EnhancedTableView<AliceChat>
      items={items as AliceChat[]}
      item={item as AliceChat}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Chat"
      viewTooltip="View Chat"
    />
  );
};

export default ChatTableView;