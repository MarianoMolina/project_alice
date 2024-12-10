import React from 'react';
import APIConfigFlexibleView from './APIConfigFlexibleView';
import APIConfigListView from './APIConfigListView';
import APIConfigTableView from './APIConfigTableView';
import APIConfigCardView from './APIConfigCardView';
import APIConfigShortListView from './APIConfigShortListView';
import { APIConfig, APIConfigComponentProps } from '../../../../types/ApiConfigTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import ApiConfigTooltipView from './ApiConfigTooltipView';

type BaseAPIConfigMode = BaseDbElementProps<APIConfig>['mode'];
type ExtendedAPIConfigMode = 'list' | 'shortList' | 'card' | 'table' | 'tooltip';
type EnhancedAPIConfigMode = BaseAPIConfigMode | ExtendedAPIConfigMode;

interface EnhancedAPIConfigProps extends Omit<APIConfigComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedAPIConfigMode;
  itemId?: string;
  item?: Partial<APIConfig> | null;
  fetchAll: boolean;
  onSave?: (savedItem: APIConfig) => void;
  onDelete?: (deletedItem: APIConfig) => Promise<void>;
}

const EnhancedAPIConfig: React.FC<EnhancedAPIConfigProps> = (props) => {
  const renderContent = (
    items: APIConfig[] | null,
    item: APIConfig | null,
    onChange: (newItem: Partial<APIConfig>) => void,
    mode: BaseAPIConfigMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: APIConfig) => Promise<void>,
  ) => {
    const commonProps: APIConfigComponentProps = {
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
        return <APIConfigFlexibleView {...commonProps} />;
      case 'shortList':
        return <APIConfigShortListView {...commonProps} />;
      case 'list':
        return <APIConfigListView {...commonProps}/>;
      case 'table':
        return <APIConfigTableView {...commonProps} />;
      case 'card':
        return <APIConfigCardView {...commonProps} />;
      case 'tooltip':
        return <ApiConfigTooltipView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<APIConfig>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<APIConfig>
      collectionName="apiconfigs"
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

export default EnhancedAPIConfig;