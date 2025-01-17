import React from 'react';
import { DataCluster, DataClusterComponentProps } from '../../../../types/DataClusterTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';
import { howManyReferences } from '../../../../types/ReferenceTypes';

const DataClusterTableView: React.FC<DataClusterComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Reference Count',
      render: (dataCluster: DataCluster) => howManyReferences(dataCluster).toString(),
    },
    {
      header: 'Created At',
      render: (dataCluster: DataCluster) => new Date(dataCluster.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<DataCluster>
      items={items as DataCluster[]}
      item={item as DataCluster}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select User Interaction"
      viewTooltip="View User Interaction"
    />
  );
};

export default DataClusterTableView;