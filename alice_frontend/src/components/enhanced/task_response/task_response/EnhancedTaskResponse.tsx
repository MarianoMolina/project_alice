import React from 'react';
import TaskResponseListView from './TaskResponseListView';
import TaskResponseTableView from './TaskResponseTableView';
import TaskResponseCardView from './TaskResponseCardView';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import TaskResponseShortList from './TaskResponseShortListView';

type BaseTaskResponseMode = BaseDbElementProps<TaskResponse>['mode'];
type ExtendedTaskResponseMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedTaskResponseMode = BaseTaskResponseMode | ExtendedTaskResponseMode;

interface EnhancedTaskResponseProps extends Omit<TaskResponseComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedTaskResponseMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: TaskResponse) => void;
  onDelete?: (deletedItem: TaskResponse) => Promise<void>;
  onInteraction?: (selectedItem: TaskResponse) => void;
  onView?: (viewItem: TaskResponse) => void;
}

const EnhancedTaskResponse: React.FC<EnhancedTaskResponseProps> = (props) => {
  const renderContent = (
    items: TaskResponse[] | null,
    item: TaskResponse | null,
    onChange: (newItem: Partial<TaskResponse>) => void,
    mode: BaseTaskResponseMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: TaskResponse) => Promise<void>,
  ) => {
    const commonProps: TaskResponseComponentProps = {
      items,
      item,
      mode,
      onChange,
      handleSave,
      handleDelete: onDelete,
      onInteraction: props.onInteraction,
      isInteractable: false,
      onView: props.onView,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'shortList':
        return <TaskResponseShortList {...commonProps} />;
      case 'list':
        return <TaskResponseListView {...commonProps} />;
      case 'table':
        return <TaskResponseTableView {...commonProps} />;
      case 'card':
      case 'view':
      case 'create':
      case 'edit':
        return <TaskResponseCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<TaskResponse>['mode'] =
    props.mode === 'create' ? 'create' :
      props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<TaskResponse>
      collectionName="taskresults"
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

export default EnhancedTaskResponse;