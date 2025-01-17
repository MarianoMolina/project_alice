import React from 'react';
import { ToolCallComponentProps, ToolCall } from '../../../../types/ToolCallTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

const ToolCallTableView: React.FC<ToolCallComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Type',
      render: (ToolCall: ToolCall) => ToolCall.type,
      sortKey: 'type'
    },
    {
      header: 'Description',
      render: (ToolCall: ToolCall) => ToolCall.function?.name || 'N/A',
      sortKey: 'description'
    },
    {
      header: 'Created At',
      render: (ToolCall: ToolCall) => new Date(ToolCall.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<ToolCall>
      items={items as ToolCall[]}
      item={item as ToolCall}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add ToolCall"
      viewTooltip="View ToolCall"
    />
  );
};

export default ToolCallTableView;