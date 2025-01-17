import React from 'react';
import BaseDbElement, { BaseDbElementProps } from '../../../common/enhanced_component/BaseDbElement';
import { PopulatedToolCall, ToolCall, ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import ToolCallFlexibleView from './ToolCallFlexibleView';
import ToolCallListView from './ToolCallListView';
import ToolCallTableView from './ToolCallTableView';
import ToolCallCardView from './ToolCallCardView';
import ToolCallShortListView from './ToolCallShortListView';;

type BaseToolCallMode = BaseDbElementProps<ToolCall>['mode'];
type ExtendedToolCallMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedToolCallMode = BaseToolCallMode | ExtendedToolCallMode;

interface EnhancedToolCallProps extends Omit<ToolCallComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedToolCallMode;
  item?: Partial<ToolCall | PopulatedToolCall> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: ToolCall | PopulatedToolCall) => void;
  onDelete?: (deletedItem: ToolCall | PopulatedToolCall) => Promise<void>;
}

const EnhancedToolCall: React.FC<EnhancedToolCallProps> = (props) => {
  const renderContent = (
    items: (ToolCall | PopulatedToolCall)[] | null,
    item: ToolCall | PopulatedToolCall | null,
    onChange: (newItem: Partial<ToolCall | PopulatedToolCall>) => void,
    mode: BaseToolCallMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: ToolCall | PopulatedToolCall) => Promise<void>,
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
    <BaseDbElement<ToolCall | PopulatedToolCall>
      collectionName="toolcalls"
      itemId={props.itemId}
      partialItem={props.item as PopulatedToolCall || undefined}
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