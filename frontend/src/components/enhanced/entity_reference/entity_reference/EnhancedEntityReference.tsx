import React from 'react';
import EntityReferenceFlexibleView from './EntityReferenceFlexibleView';
import EntityReferenceListView from './EntityReferenceListView';
import EntityReferenceTableView from './EntityReferenceTableView';
import EntityReferenceCardView from './EntityReferenceCardView';
import EntityReferenceShortListView from './EntityReferenceShortListView';
import { EntityReference } from '../../../../types/EntityReferenceTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';

type BaseEntityReferenceMode = BaseDbElementProps<EntityReference>['mode'];
type ExtendedEntityReferenceMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedEntityReferenceMode = BaseEntityReferenceMode | ExtendedEntityReferenceMode;

interface EnhancedEntityReferenceProps extends Omit<EntityReferenceComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedEntityReferenceMode;
  item?: Partial<EntityReference> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: EntityReference) => void;
  onDelete?: (deletedItem: EntityReference) => Promise<void>;
}

const EnhancedEntityReference: React.FC<EnhancedEntityReferenceProps> = (props) => {
  const renderContent = (
    items: EntityReference[] | null,
    item: EntityReference | null,
    onChange: (newItem: Partial<EntityReference>) => void,
    mode: BaseEntityReferenceMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: EntityReference) => Promise<void>,
  ) => {
    const commonProps: EntityReferenceComponentProps = {
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
        return <EntityReferenceFlexibleView {...commonProps} />;
      case 'shortList':
        return <EntityReferenceShortListView {...commonProps} />;
      case 'list':
        return <EntityReferenceListView {...commonProps}/>;
      case 'table':
        return <EntityReferenceTableView {...commonProps} />;
      case 'card':
        return <EntityReferenceCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<EntityReference>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<EntityReference>
      collectionName="entityreferences"
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

export default EnhancedEntityReference;