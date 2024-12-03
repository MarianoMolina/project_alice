import React from 'react';
import { APIConfigComponentProps, APIConfig } from '../../../../types/ApiConfigTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const APIConfigTableView: React.FC<APIConfigComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'API Name',
      render: (APIConfig: APIConfig) => APIConfig.api_name,
      sortKey: 'api_name'
    },
    {
      header: 'Name',
      render: (APIConfig: APIConfig) => APIConfig.name || 'N/A',
      sortKey: 'name'
    },
    {
      header: 'Created At',
      render: (APIConfig: APIConfig) => new Date(APIConfig.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<APIConfig>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add APIConfig"
      viewTooltip="View APIConfig"
    />
  );
};

export default APIConfigTableView;