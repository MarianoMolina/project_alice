import React from 'react';
import { TaskResponse, TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

const TaskResponseTableView: React.FC<TaskResponseComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Task Name',
      render: (task_response: TaskResponse) => task_response.task_name,
      sortKey: 'task_name'
    },
    {
      header: 'Status',
      render: (task_response: TaskResponse) => task_response.status || 'N/A',
      sortKey: 'status'
    },
    {
      header: 'Created At',
      render: (task_response: TaskResponse) => new Date(task_response.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<TaskResponse>
      items={items as TaskResponse[]}
      item={item as TaskResponse}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Task Response"
      viewTooltip="View Task Response"
    />
  );
};

export default TaskResponseTableView;