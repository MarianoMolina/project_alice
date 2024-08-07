import React from 'react';
import { TaskResponse, TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

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
      render: (task_response: TaskResponse) => task_response.task_name
    },
    {
      header: 'Status',
      render: (task_response: TaskResponse) => task_response.status || 'N/A'
    },
    {
      header: 'Created At',
      render: (task_response: TaskResponse) => new Date(task_response.createdAt || '').toLocaleString()
    }
  ];

  return (
    <EnhancedTableView<TaskResponse>
      items={items}
      item={item}
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