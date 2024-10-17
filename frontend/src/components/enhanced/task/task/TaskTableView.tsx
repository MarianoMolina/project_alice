import React from 'react';
import { TaskComponentProps, AliceTask } from '../../../../types/TaskTypes';
import EnhancedTableView, { Column } from '../../common/enhanced_component/TableView';

const TaskTableView: React.FC<TaskComponentProps> = ({
  items,
  item,
  isInteractable = false,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns: Column<AliceTask>[] = [
    {
      header: 'Task Name',
      render: (task: AliceTask) => task.task_name,
      sortKey: 'task_name'
    },
    {
      header: 'Description',
      render: (task: AliceTask) => task.task_description || 'N/A',
      sortKey: 'task_description'
    },
    {
      header: 'Type',
      render: (task: AliceTask) =>  task.task_type || 'N/A',
      sortKey: 'task_type'
    }
  ];

  return (
    <EnhancedTableView<AliceTask>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Task"
      viewTooltip="View Task"
    />
  );
};

export default TaskTableView;