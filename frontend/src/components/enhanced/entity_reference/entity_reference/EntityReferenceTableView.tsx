import React from 'react';
import { EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';
import { head } from 'lodash';

const EntityReferenceTableView: React.FC<EntityReferenceComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'name',
      render: (entityReference: EntityReference) => entityReference.name ?? '',
      sortKey: 'name'
    },
    {
      header: 'Categories',
      render: (entityReference: EntityReference) => entityReference.categories.join(', '),
      sortKey: 'categories'
    },
    {
      header: 'Created At',
      render: (entityReference: EntityReference) => new Date(entityReference.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<EntityReference>
      items={items}
      item={item}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select URL Reference"
      viewTooltip="View URL Reference"
    />
  );
};

export default EntityReferenceTableView;