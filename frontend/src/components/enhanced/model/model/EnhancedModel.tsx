import React from 'react';
import ModelFlexibleView from './ModelFlexibleView';
import ModelListView from './ModelListView';
import ModelTableView from './ModelTableView';
import ModelShortListView from './ModelShortListView';
import ModelCardView from './ModelCardView';
import { AliceModel } from '../../../../types/ModelTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { ModelComponentProps } from '../../../../types/ModelTypes';

type BaseModelMode = BaseDbElementProps<AliceModel>['mode'];
type ExtendedModelMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedModelMode = BaseModelMode | ExtendedModelMode;

interface EnhancedModelProps extends Omit<ModelComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedModelMode;
  item?: Partial<AliceModel> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: AliceModel) => void;
  onDelete?: (deletedItem: AliceModel) => Promise<void>;
}

const EnhancedModel: React.FC<EnhancedModelProps> = (props: EnhancedModelProps) => {
  const renderContent = (
    items: AliceModel[] | null,
    item: AliceModel | null,
    onChange: (newItem: Partial<AliceModel>) => void,
    mode: BaseModelMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: AliceModel) => Promise<void>,
  ) => {
    const commonProps: ModelComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
      handleDelete: onDelete,
      onView: props.onView,
      isInteractable: props.isInteractable,
      onInteraction: props.onInteraction,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'create':
      case 'edit':
      case 'view':
        return <ModelFlexibleView {...commonProps} />;
      case 'shortList':
        return <ModelShortListView {...commonProps} />;
      case 'list':
        return <ModelListView {...commonProps}/>;
      case 'table':
        return <ModelTableView {...commonProps} />;
      case 'card':
        return <ModelCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<AliceModel>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<AliceModel>
      collectionName="models"
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

export default EnhancedModel;