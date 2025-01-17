import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import EnhancedTableView from '../../../common/enhanced_component/TableView';
import {  getFileSize } from '../../../../utils/FileUtils';

const FileTableView: React.FC<FileComponentProps> = ({
  items,
  item,
  onInteraction,
  onView,
  showHeaders = true,
}) => {
  const columns = [
    {
      header: 'Filename',
      render: (file: FileReference) => file.filename,
      sortKey: 'filename'
    },
    {
      header: 'Type',
      render: (file: FileReference) => file.type,
      sortKey: 'type'
    },
    {
      header: 'Size',
      render: (file: FileReference) => getFileSize(file.file_size).formatted,
      sortKey: 'file_size'
    },
    {
      header: 'Last Accessed',
      render: (file: FileReference) => file.last_accessed ? new Date(file.last_accessed).toLocaleString() : 'Never',
      sortKey: 'last_accessed'
    }
  ];

  return (
    <EnhancedTableView<FileReference>
      items={items as FileReference[]}
      item={item as FileReference}
      columns={columns}
      onView={onView}
      onInteraction={onInteraction}
      showHeaders={showHeaders}
      interactionTooltip="Select File"
      viewTooltip="View File Details"
    />
  );
};

export default FileTableView;