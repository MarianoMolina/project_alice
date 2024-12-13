import React from 'react';
import { CodeExecution, CodeExecutionComponentProps } from '../../../../types/CodeExecutionTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const CodeExecutionListView: React.FC<CodeExecutionComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (codeExecution: CodeExecution) => codeExecution.code_block?.language || 'CodeExecution';
    const getSecondaryText = (codeExecution: CodeExecution) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Completed? {codeExecution.code_output?.exit_code === 0 ? 'Yes' : 'No'}
        </Typography>
    );

    return (
        <EnhancedListView<CodeExecution>
            items={items as CodeExecution[]}
            item={item as CodeExecution}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add CodeExecution"
            viewTooltip="View CodeExecution"
            collectionElementString='CodeExecution'
        />
    );
};

export default CodeExecutionListView;