import React from 'react';
import { CodeExecutionComponentProps, CodeExecution } from '../../../../types/CodeExecutionTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const CodeExecutionTableView: React.FC<CodeExecutionComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Type',
      render: (codeExecution: CodeExecution) => codeExecution.code_block?.language || 'N/A',
      sortKey: 'language'
    },
    {
      header: 'Created At',
      render: (codeExecution: CodeExecution) => new Date(codeExecution.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<CodeExecution>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add CodeExecution"
      viewTooltip="View CodeExecution"
    />
  );
};

export default CodeExecutionTableView;