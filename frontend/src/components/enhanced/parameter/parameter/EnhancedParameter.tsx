import React from 'react';
import ParameterFlexibleView from './ParameterFlexibleView';
import ParameterListView from './ParameterListView';
import ParameterTableView from './ParameterTableView';
import ParameterCardView from './ParameterCardView';
import ParameterShortListView from './ParameterShortListView';
import { ParameterDefinition } from '../../../../types/ParameterTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { ParameterComponentProps } from '../../../../types/ParameterTypes';

type BaseParameterMode = BaseDbElementProps<ParameterDefinition>['mode'];
type ExtendedParameterMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedParameterMode = BaseParameterMode | ExtendedParameterMode;

interface EnhancedParameterProps extends Omit<ParameterComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedParameterMode;
  item?: Partial<ParameterDefinition> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: ParameterDefinition) => void;
  onDelete?: (deletedItem: ParameterDefinition) => Promise<void>;
}

const EnhancedParameter: React.FC<EnhancedParameterProps> = (props) => {
  const renderContent = (
    items: ParameterDefinition[] | null,
    item: ParameterDefinition | null,
    onChange: (newItem: Partial<ParameterDefinition>) => void,
    mode: BaseParameterMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: ParameterDefinition) => Promise<void>,
  ) => {
    const commonProps: ParameterComponentProps = {
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
        return <ParameterFlexibleView {...commonProps} />;
      case 'shortList':
        return <ParameterShortListView {...commonProps} />;
      case 'list':
        return <ParameterListView {...commonProps}/>;
      case 'table':
        return <ParameterTableView {...commonProps} />;
      case 'card':
        return <ParameterCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<ParameterDefinition>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<ParameterDefinition>
      collectionName="parameters"
      itemId={props.itemId}
      mode={baseDbMode}
      partialItem={props.item || undefined}
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      onDelete={props.onDelete}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedParameter;