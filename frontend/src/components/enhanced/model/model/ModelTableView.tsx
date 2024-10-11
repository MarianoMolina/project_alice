import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const ModelTableView: React.FC<ModelComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Model Name',
      render: (model: AliceModel) => model.model_name,
      sortKey: 'model_name'
    },
    {
      header: 'API',
      render: (model: AliceModel) => model.api_name || 'N/A',
      sortKey: 'api_name'
    },
    {
      header: 'Created At',
      render: (model: AliceModel) => new Date(model.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<AliceModel>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Model"
      viewTooltip="View Model"
    />
  );
};

export default ModelTableView;