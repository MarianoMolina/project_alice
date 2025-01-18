import React from 'react';
import UserInteractionListView from './UserInteractionListView';
import UserInteractionTableView from './UserInteractionTableView';
import UserInteractionCardView from './UserInteractionCardView';
import UserInteractionShortListView from './UserInteractionShortListView';
import { PopulatedUserInteraction, UserInteraction } from '../../../../types/UserInteractionTypes';
import BaseDbElement, { BaseDbElementProps } from '../../../common/enhanced_component/BaseDbElement';
import { UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';

type BaseUserInteractionMode = BaseDbElementProps<UserInteraction>['mode'];
type ExtendedUserInteractionMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedUserInteractionMode = BaseUserInteractionMode | ExtendedUserInteractionMode;

interface EnhancedUserInteractionProps extends Omit<UserInteractionComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedUserInteractionMode;
  item?: Partial<UserInteraction | PopulatedUserInteraction> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: UserInteraction | PopulatedUserInteraction) => void;
  onDelete?: (deletedItem: UserInteraction | PopulatedUserInteraction) => Promise<void>;
}

const EnhancedUserInteraction: React.FC<EnhancedUserInteractionProps> = (props) => {
  const renderContent = (
    items: (UserInteraction | PopulatedUserInteraction)[] | null,
    item: UserInteraction | PopulatedUserInteraction | null,
    onChange: (newItem: Partial<UserInteraction | PopulatedUserInteraction>) => void,
    mode: BaseUserInteractionMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: UserInteraction | PopulatedUserInteraction) => Promise<void>,
  ) => {
    const commonProps: UserInteractionComponentProps = {
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
      case 'card':
        return <UserInteractionCardView {...commonProps} />;
      case 'shortList':
        return <UserInteractionShortListView {...commonProps} />;
      case 'list':
        return <UserInteractionListView {...commonProps}/>;
      case 'table':
        return <UserInteractionTableView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<UserInteraction>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<UserInteraction | PopulatedUserInteraction>
      collectionName="userinteractions"
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

export default EnhancedUserInteraction;