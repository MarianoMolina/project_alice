import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../utils/ModelTypes';
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
      render: (model: AliceModel) => model.model_name
    },
    {
      header: 'API',
      render: (model: AliceModel) => model.api_name || 'N/A'
    },
    {
      header: 'Created At',
      render: (model: AliceModel) => new Date(model.createdAt || '').toLocaleString()
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