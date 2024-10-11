import React from 'react';
import { URLReference, URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import EnhancedTableView from '../../common/enhanced_component/TableView';

const URLReferenceTableView: React.FC<URLReferenceComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Title',
      render: (urlReference: URLReference) => urlReference.title,
      sortKey: 'title'
    },
    {
      header: 'URL',
      render: (urlReference: URLReference) => urlReference.url,
      sortKey: 'url'
    },
    {
      header: 'Created At',
      render: (urlReference: URLReference) => new Date(urlReference.createdAt || '').toLocaleString(),
      sortKey: 'createdAt'
    }
  ];

  return (
    <EnhancedTableView<URLReference>
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

export default URLReferenceTableView;