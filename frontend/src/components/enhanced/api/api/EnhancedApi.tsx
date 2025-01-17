import React from 'react';
import ApiFlexibleView from './ApiFlexibleView';
import ApiListView from './ApiListView';
import ApiTableView from './ApiTableView';
import ApiCardView from './ApiCardView';
import APIShortListView from './ApiShortListView';
import { API } from '../../../../types/ApiTypes';
import BaseDbElement, { BaseDbElementProps } from '../../../common/enhanced_component/BaseDbElement';
import { ApiComponentProps } from '../../../../types/ApiTypes';

type BaseApiMode = BaseDbElementProps<API>['mode'];
type ExtendedApiMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedApiMode = BaseApiMode | ExtendedApiMode;

interface EnhancedApiProps extends Omit<ApiComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedApiMode;
  item?: Partial<API> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: API) => void;
  onDelete?: (deletedItem: API) => Promise<void>;
}

const EnhancedAPI: React.FC<EnhancedApiProps> = (props: EnhancedApiProps) => {
  const renderContent = (
    items: API[] | null,
    item: API | null,
    onChange: (newItem: Partial<API>) => void,
    mode: BaseApiMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: API) => Promise<void>,
  ) => {
    const commonProps: ApiComponentProps = {
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
        return <ApiFlexibleView {...commonProps} />;
      case 'shortList':
        return <APIShortListView {...commonProps} />;
      case 'list':
        return <ApiListView {...commonProps}/>;
      case 'table':
        return <ApiTableView {...commonProps} />;
      case 'card':
        return <ApiCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<API>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<API>
      collectionName="apis"
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

export default EnhancedAPI;