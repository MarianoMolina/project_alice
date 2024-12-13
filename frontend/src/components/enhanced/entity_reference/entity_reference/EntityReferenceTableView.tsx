import React from 'react';
import { EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';

const EntityReferenceTableView: React.FC<EntityReferenceComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Name',
      render: (entityReference: EntityReference) => entityReference.name ?? '',
      sortKey: 'name'
    },
    {
      header: 'Source',
      render: (entityReference: EntityReference) => formatCamelCaseString(entityReference.source as string),
      sortKey: 'source'
    },
    {
      header: 'Created At',
      render: (entityReference: EntityReference) => new Date(entityReference.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<EntityReference>
      items={items as EntityReference[]}
      item={item as EntityReference}
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