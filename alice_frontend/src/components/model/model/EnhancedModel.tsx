import React from 'react';
import ModelFlexibleView from './ModelFlexibleView';
import ModelListView from './ModelListView';
import ModelTableView from './ModelTableView';
import ModelCardView from './ModelCardView';
import { AliceModel } from '../../../utils/ModelTypes';
import BaseDbElement, { BaseDbElementProps } from '../../BaseDbElement';
import { ModelComponentProps } from '../../../utils/ModelTypes';

type BaseModelMode = BaseDbElementProps<AliceModel>['mode'];
type ExtendedModelMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedModelMode = BaseModelMode | ExtendedModelMode;

interface EnhancedModelProps extends Omit<ModelComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedModelMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: AliceModel) => void;
}

const EnhancedModel: React.FC<EnhancedModelProps> = (props: EnhancedModelProps) => {
  const renderContent = (
    items: AliceModel[] | null,
    item: AliceModel | null,
    onChange: (newItem: Partial<AliceModel>) => void,
    mode: BaseModelMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: ModelComponentProps = {
      items,
      item,
      onChange,
      mode,
      handleSave,
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
      case 'list':
      case 'shortList':
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
      mode={baseDbMode}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedModel;