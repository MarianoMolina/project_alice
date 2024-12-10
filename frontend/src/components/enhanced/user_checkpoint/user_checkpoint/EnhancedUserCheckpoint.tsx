import React from 'react';
import UserCheckpointListView from './UserCheckpointListView';
import UserCheckpointTableView from './UserCheckpointTableView';
import UserCheckpointCardView from './UserCheckpointCardView';
import UserCheckpointShortListView from './UserCheckpointShortListView';
import { UserCheckpoint } from '../../../../types/UserCheckpointTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import UserCheckpointFlexibleView from './UserCheckpointFlexibleView';

type BaseUserCheckpointMode = BaseDbElementProps<UserCheckpoint>['mode'];
type ExtendedUserCheckpointMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedUserCheckpointMode = BaseUserCheckpointMode | ExtendedUserCheckpointMode;

interface EnhancedUserCheckpointProps extends Omit<UserCheckpointComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedUserCheckpointMode;
  item?: Partial<UserCheckpoint> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: UserCheckpoint) => void;
  onDelete?: (deletedItem: UserCheckpoint) => Promise<void>;
}

const EnhancedUserCheckpoint: React.FC<EnhancedUserCheckpointProps> = (props) => {
  const renderContent = (
    items: UserCheckpoint[] | null,
    item: UserCheckpoint | null,
    onChange: (newItem: Partial<UserCheckpoint>) => void,
    mode: BaseUserCheckpointMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: UserCheckpoint) => Promise<void>,
  ) => {
    const commonProps: UserCheckpointComponentProps = {
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
        return <UserCheckpointFlexibleView {...commonProps} />;
      case 'card':
        return <UserCheckpointCardView {...commonProps} />;
      case 'shortList':
        return <UserCheckpointShortListView {...commonProps} />;
      case 'list':
        return <UserCheckpointListView {...commonProps}/>;
      case 'table':
        return <UserCheckpointTableView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<UserCheckpoint>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<UserCheckpoint>
      collectionName="usercheckpoints"
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

export default EnhancedUserCheckpoint;