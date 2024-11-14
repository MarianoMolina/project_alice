import React from 'react';
import CodeExecutionFlexibleView from './CodeExecutionFlexibleView';
import CodeExecutionListView from './CodeExecutionListView';
import CodeExecutionTableView from './CodeExecutionTableView';
import CodeExecutionCardView from './CodeExecutionCardView';
import CodeExecutionShortListView from './CodeExecutionShortListView';
import { CodeExecution } from '../../../../types/CodeExecutionTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';

type BaseCodeExecutionMode = BaseDbElementProps<CodeExecution>['mode'];
type ExtendedCodeExecutionMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedCodeExecutionMode = BaseCodeExecutionMode | ExtendedCodeExecutionMode;

interface EnhancedCodeExecutionProps extends Omit<CodeExecutionComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedCodeExecutionMode;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: CodeExecution) => void;
  onDelete?: (deletedItem: CodeExecution) => Promise<void>;
}

const EnhancedCodeExecution: React.FC<EnhancedCodeExecutionProps> = (props) => {
  const renderContent = (
    items: CodeExecution[] | null,
    item: CodeExecution | null,
    onChange: (newItem: Partial<CodeExecution>) => void,
    mode: BaseCodeExecutionMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: CodeExecution) => Promise<void>,
  ) => {
    const commonProps: CodeExecutionComponentProps = {
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
        return <CodeExecutionFlexibleView {...commonProps} />;
      case 'shortList':
        return <CodeExecutionShortListView {...commonProps} />;
      case 'list':
        return <CodeExecutionListView {...commonProps}/>;
      case 'table':
        return <CodeExecutionTableView {...commonProps} />;
      case 'card':
        return <CodeExecutionCardView {...commonProps} />;
      default:
        return null;
    }
  };

  const baseDbMode: BaseDbElementProps<CodeExecution>['mode'] =
    props.mode === 'create' ? 'create' :
    props.mode === 'edit' ? 'edit' : 'view';

  return (
    <BaseDbElement<CodeExecution>
      collectionName="codeexecutions"
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

export default EnhancedCodeExecution;