import React from 'react';
import ParameterFlexibleView from './ParameterFlexibleView';
import ParameterListView from './ParameterListView';
import ParameterTableView from './ParameterTableView';
import ParameterCardView from './ParameterCardView';
import { ParameterDefinition } from '../../../utils/ParameterTypes';
import BaseDbElement, { BaseDbElementProps } from '../../BaseDbElement';
import { ParameterComponentProps } from '../../../utils/ParameterTypes';

type BaseParameterMode = BaseDbElementProps<ParameterDefinition>['mode'];
type ExtendedParameterMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedParameterMode = BaseParameterMode | ExtendedParameterMode;

interface EnhancedParameterProps extends Omit<ParameterComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedParameterMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: ParameterDefinition) => void;
}

const EnhancedParameter: React.FC<EnhancedParameterProps> = (props) => {
  const renderContent = (
    items: ParameterDefinition[] | null,
    item: ParameterDefinition | null,
    onChange: (newItem: Partial<ParameterDefinition>) => void,
    mode: BaseParameterMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: ParameterComponentProps = {
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
        return <ParameterFlexibleView {...commonProps} />;
      case 'list':
      case 'shortList':
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
      isInteractable={props.isInteractable}
      onInteraction={props.onInteraction}
      onSave={props.onSave}
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedParameter;