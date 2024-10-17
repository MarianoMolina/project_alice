import React from 'react';
import { UserInteraction, UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const UserInteractionTableView: React.FC<UserInteractionComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Prompt',
      render: (userInteraction: UserInteraction) => userInteraction.user_prompt.substring(0, 50),
      sortKey: 'user_prompt'
    },
    {
      header: 'Status',
      render: (userInteraction: UserInteraction) => userInteraction.user_response ? 'User responded' : 'No user response',
    },
    {
      header: 'Created At',
      render: (userInteraction: UserInteraction) => new Date(userInteraction.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<UserInteraction>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select URL Reference"
      viewTooltip="View URL Reference"
    />
  );
};

export default UserInteractionTableView;