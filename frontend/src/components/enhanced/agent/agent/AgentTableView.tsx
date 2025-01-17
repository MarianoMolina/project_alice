import React from 'react';
import { AgentComponentProps, AliceAgent } from '../../../../types/AgentTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

const AgentTableView: React.FC<AgentComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Agent Name',
      render: (agent: AliceAgent) => agent.name,
      sortKey: 'name'
    },
    {
      header: 'Chat Model',
      render: (agent: AliceAgent) => agent.models?.chat?.model_name || 'N/A',
    },
    {
      header: 'Tool',
      render: (agent: AliceAgent) => agent.has_tools,
      sortKey: 'has_tools'
    },
    {
      header: 'Code',
      render: (agent: AliceAgent) => agent.has_code_exec,
      sortKey: 'has_code_exec'
    }
  ];

  return (
    <EnhancedTableView<AliceAgent>
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

export default AgentTableView;