import React from 'react';
import FileFlexibleView from './FileFlexibleView';
import FileListView from './FileListView';
import FileTableView from './FileTableView';
import FileCardView from './FileCardView';
import FileShortListView from './FileShortListView';
import { FileReference, PopulatedFileReference } from '../../../../types/FileTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { FileComponentProps } from '../../../../types/FileTypes';

type BaseFileMode = BaseDbElementProps<FileReference>['mode'];
type ExtendedFileMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedFileMode = BaseFileMode | ExtendedFileMode;

interface EnhancedFileProps extends Omit<FileComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedFileMode;
  item?: Partial<FileReference | PopulatedFileReference> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: FileReference | PopulatedFileReference) => void;
  onDelete?: (deletedItem: FileReference | PopulatedFileReference) => Promise<void>;
}

const EnhancedFile: React.FC<EnhancedFileProps> = (props) => {
  const renderContent = (
    items: (FileReference | PopulatedFileReference)[] | null,
    item: FileReference | PopulatedFileReference | null,
    onChange: (newItem: Partial<FileReference | PopulatedFileReference>) => void,
    mode: BaseFileMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: FileReference | PopulatedFileReference) => Promise<void>,
  ) => {
    const commonProps: FileComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      onView: props.onView,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <FileFlexibleView {...commonProps} />;
      case 'shortList':
        return <FileShortListView {...commonProps} />;
      case 'list':
        return <FileListView {...commonProps}/>;
      case 'table':
        return <FileTableView {...commonProps} />;
      case 'card':
        return <FileCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<FileReference>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<FileReference | PopulatedFileReference>
      collectionName="files"
      itemId={props.itemId}
      partialItem={props.item || undefined}
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      onDelete={props.onDelete}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedFile;