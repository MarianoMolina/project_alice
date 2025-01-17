import React from 'react';
import { UserCheckpoint, UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

const UserCheckpointTableView: React.FC<UserCheckpointComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Prompt',
      render: (userCheckpoint: UserCheckpoint) => userCheckpoint.user_prompt.substring(0, 50),
      sortKey: 'user_prompt'
    },
    {
      header: 'Status',
      render: (userCheckpoint: UserCheckpoint) => userCheckpoint.request_feedback ? 'Requests feedback' : 'No added feedback requested',
    },
    {
      header: 'Created At',
      render: (userCheckpoint: UserCheckpoint) => new Date(userCheckpoint.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<UserCheckpoint>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select User Checkpoint"
      viewTooltip="View User Checkpoint"
    />
  );
};

export default UserCheckpointTableView;