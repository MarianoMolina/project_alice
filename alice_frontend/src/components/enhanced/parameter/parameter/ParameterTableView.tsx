import React from 'react';
import { ParameterComponentProps, ParameterDefinition } from '../../../../types/ParameterTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const ParameterTableView: React.FC<ParameterComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Type',
      render: (parameter: ParameterDefinition) => parameter.type
    },
    {
      header: 'Description',
      render: (parameter: ParameterDefinition) => parameter.description || 'N/A'
    },
    {
      header: 'Created At',
      render: (parameter: ParameterDefinition) => new Date(parameter.createdAt || '').toLocaleString()
    }
  ];

  return (
    <EnhancedTableView<ParameterDefinition>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Add Parameter"
      viewTooltip="View Parameter"
    />
  );
};

export default ParameterTableView;