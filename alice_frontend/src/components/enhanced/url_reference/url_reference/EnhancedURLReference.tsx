import React from 'react';
import URLReferenceFlexibleView from './URLReferenceFlexibleView';
import URLReferenceListView from './URLReferenceListView';
import URLReferenceTableView from './URLReferenceTableView';
import URLReferenceCardView from './URLReferenceCardView';
import URLReferenceShortListView from './URLReferenceShortListView';
import { URLReference } from '../../../../types/URLReferenceTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';

type BaseURLReferenceMode = BaseDbElementProps<URLReference>['mode'];
type ExtendedURLReferenceMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedURLReferenceMode = BaseURLReferenceMode | ExtendedURLReferenceMode;

interface EnhancedURLReferenceProps extends Omit<URLReferenceComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedURLReferenceMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: URLReference) => void;
  onDelete?: (deletedItem: URLReference) => Promise<void>;
}

const EnhancedURLReference: React.FC<EnhancedURLReferenceProps> = (props) => {
  const renderContent = (
    items: URLReference[] | null,
    item: URLReference | null,
    onChange: (newItem: Partial<URLReference>) => void,
    mode: BaseURLReferenceMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: URLReference) => Promise<void>,
  ) => {
    const commonProps: URLReferenceComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      isInteractable: props.isInteractable,
      onView: props.onView,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <URLReferenceFlexibleView {...commonProps} />;
      case 'shortList':
        return <URLReferenceShortListView {...commonProps} />;
      case 'list':
        return <URLReferenceListView {...commonProps}/>;
      case 'table':
        return <URLReferenceTableView {...commonProps} />;
      case 'card':
        return <URLReferenceCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<URLReference>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<URLReference>
      collectionName="urlreferences"
      itemId={props.itemId}
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

export default EnhancedURLReference;