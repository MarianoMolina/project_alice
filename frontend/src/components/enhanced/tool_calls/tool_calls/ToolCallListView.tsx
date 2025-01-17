import React from 'react';
import { ToolCall, ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';

const ToolCallListView: React.FC<ToolCallComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (ToolCall: ToolCall) => ToolCall.function?.name || 'No ToolCall name';
    const getSecondaryText = (ToolCall: ToolCall) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Description: {JSON.stringify(ToolCall.function?.arguments)}
        </Typography>
    );

    return (
        <EnhancedListView<ToolCall>
            items={items as ToolCall[]}
            item={item as ToolCall}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add ToolCall"
            viewTooltip="View ToolCall"
            collectionElementString='ToolCall'
        />
    );
};

export default ToolCallListView;