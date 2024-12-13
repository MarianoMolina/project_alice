import React from 'react';
import CodeExecutionFlexibleView from './CodeExecutionFlexibleView';
import CodeExecutionListView from './CodeExecutionListView';
import CodeExecutionTableView from './CodeExecutionTableView';
import CodeExecutionCardView from './CodeExecutionCardView';
import CodeExecutionShortListView from './CodeExecutionShortListView';
import { CodeExecution, PopulatedCodeExecution } from '../../../../types/CodeExecutionTypes';
import BaseDbElement, { BaseDbElementProps } from '../../common/enhanced_component/BaseDbElement';
import { CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';

type BaseCodeExecutionMode = BaseDbElementProps<CodeExecution>['mode'];
type ExtendedCodeExecutionMode = 'list' | 'shortList' | 'card' | 'table';
type EnhancedCodeExecutionMode = BaseCodeExecutionMode | ExtendedCodeExecutionMode;

interface EnhancedCodeExecutionProps extends Omit<CodeExecutionComponentProps, 'items' | 'item' | 'onChange' | 'handleSave' | 'mode'> {
  mode: EnhancedCodeExecutionMode;
  item?: Partial<CodeExecution | PopulatedCodeExecution> | null;
  itemId?: string;
  fetchAll: boolean;
  onSave?: (savedItem: CodeExecution | PopulatedCodeExecution) => void;
  onDelete?: (deletedItem: CodeExecution | PopulatedCodeExecution) => Promise<void>;
}

const EnhancedCodeExecution: React.FC<EnhancedCodeExecutionProps> = (props) => {
  const renderContent = (
    items: (CodeExecution | PopulatedCodeExecution)[] | null,
    item: CodeExecution | PopulatedCodeExecution | null,
    onChange: (newItem: Partial<CodeExecution | PopulatedCodeExecution>) => void,
    mode: BaseCodeExecutionMode,
    handleSave: () => Promise<void>,
    onDelete: (deletedItem: CodeExecution | PopulatedCodeExecution) => Promise<void>,
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
    <BaseDbElement<CodeExecution | PopulatedCodeExecution>
      collectionName="codeexecutions"
      itemId={props.itemId}
      partialItem={props.item as any || undefined}
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