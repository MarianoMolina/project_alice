import React from 'react';
import ToolCallFlexibleView from './ToolCallFlexibleView';
import ToolCallListView from './ToolCallListView';
import ToolCallTableView from './ToolCallTableView';
import ToolCallCardView from './ToolCallCardView';
import ToolCallShortListView from './ToolCallShortListView';;
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { ToolCallComponentProps,  ToolCall } from '../../../types/ToolCallTypes';

type BaseToolCallMode = BaseDbElementProps<ToolCall>['mode'];
type ExtendedToolCallMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedToolCallMode = BaseToolCallMode | ExtendedToolCallMode;

interface EnhancedToolCallProps extends Omit<ToolCallComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedToolCallMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: ToolCall) => void;
  onDelete?: (deletedItem: ToolCall) => Promise<void>;
}

const EnhancedToolCall: React.FC<EnhancedToolCallProps> = (props) => {
  const renderContent = (
    items: ToolCall[] | null,
    item: ToolCall | null,
    onChange: (newItem: Partial<ToolCall>) => void,
    mode: BaseToolCallMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: ToolCall) => Promise<void>,
  ) => {
    const commonProps: ToolCallComponentProps = {
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
        return <ToolCallFlexibleView {...commonProps} />;
      case 'shortList':
        return <ToolCallShortListView {...commonProps} />;
      case 'list':
        return <ToolCallListView {...commonProps}/>;
      case 'table':
        return <ToolCallTableView {...commonProps} />;
      case 'card':
        return <ToolCallCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<ToolCall>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<ToolCall>
      collectionName="ToolCalls"
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

export default EnhancedToolCall;