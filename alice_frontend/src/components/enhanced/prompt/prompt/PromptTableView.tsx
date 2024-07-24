import React from 'react';
import { Prompt, PromptComponentProps } from '../../../../utils/PromptTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const PromptTableView: React.FC<PromptComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Prompt Name',
      render: (prompt: Prompt) => prompt.name
    },
    {
      header: 'Templated',
      render: (prompt: Prompt) => prompt.is_templated || 'N/A'
    },
    {
      header: 'Created At',
      render: (prompt: Prompt) => new Date(prompt.createdAt || '').toLocaleString()
    }
  ];

  return (
    <EnhancedTableView<Prompt>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Agent"
      viewTooltip="View Agent"
    />
  );
};

export default PromptTableView;