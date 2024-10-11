import React from 'react';
import EnhancedTableView from '../../common/enhanced_component/TableView';
import { API, ApiComponentProps } from '../../../../types/ApiTypes';

const AgentTableView: React.FC<ApiComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Agent Name',
      render: (api: API) => api.name,
      sortKey: 'name'
    },
    {
      header: 'Model',
      render: (api: API) => api.api_type || 'N/A',
      sortKey: 'api_type'
    },
    {
      header: 'Created At',
      render: (api: API) => new Date(api.createdAt   || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<API>
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