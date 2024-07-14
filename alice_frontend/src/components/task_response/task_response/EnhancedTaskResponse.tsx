import React from 'react';
import TaskResponseListView from './TaskResponseListView';
import TaskResponseTableView from './TaskResponseTableView';
import TaskResponseCardView from './TaskResponseCardView';
import { TaskResponse } from '../../../utils/TaskResponseTypes';
import BaseDbElement, { BaseDbElementProps } from '../../BaseDbElement';
import { TaskResponseComponentProps } from '../../../utils/TaskResponseTypes';

type BaseTaskResponseMode = BaseDbElementProps<TaskResponse>['mode'];
type ExtendedTaskResponseMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedTaskResponseMode = BaseTaskResponseMode | ExtendedTaskResponseMode;

interface EnhancedTaskResponseProps extends Omit<TaskResponseComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedTaskResponseMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: TaskResponse) => void;
  onInteraction?: (selectedItem: TaskResponse) => void;
  onView?: (viewItem: TaskResponse) => void;
}

const EnhancedTaskResponse: React.FC<EnhancedTaskResponseProps> = (props) => {
  const renderContent = (
    items: TaskResponse[] | null,
    item: TaskResponse | null,
    onChange: (newItem: Partial<TaskResponse>) => void,
    mode: BaseTaskResponseMode,
    handleSave: () => Promise<void>
  ) => {
    const commonProps: TaskResponseComponentProps = {
      items,
      item,
      mode,
      onChange,
      handleSave,
      onInteraction: props.onInteraction,
      isInteractable: false,
      onView: props.onView,
      showHeaders: props.showHeaders,
    };

    switch (props.mode) {
      case 'list':
      case 'shortList':
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
      fetchAll={props.fetchAll}
      render={renderContent}
    />
  );
};

export default EnhancedTaskResponse;