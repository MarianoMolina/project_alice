import React from 'react';
import { AliceModel, ModelComponentProps } from '../../../../types/ModelTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';

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
      header: 'Model Type',
      render: (model: AliceModel) => model.model_type || 'N/A',
      sortKey: 'model_type'
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