import React from 'react';
import { CodeExecution, CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import EnhancedShortListView from '../../../common/enhanced_component/ShortListView';

const CodeExecutionShortListView: React.FC<CodeExecutionComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (codeExecution: CodeExecution) => codeExecution.code_block?.language || 'CodeExecution';
    const getSecondaryText = (codeExecution: CodeExecution) => codeExecution.code_output?.exit_code === 0 ? 'Completed' : 'Not Completed';

    return (
        <EnhancedShortListView<CodeExecution>
            items={items as CodeExecution[]}
            item={item as CodeExecution}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default CodeExecutionShortListView;