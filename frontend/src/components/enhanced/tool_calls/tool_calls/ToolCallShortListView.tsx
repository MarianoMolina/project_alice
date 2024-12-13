import React from 'react';
import { ToolCall, ToolCallComponentProps } from '../../../../types/ToolCallTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const ToolCallShortListView: React.FC<ToolCallComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (ToolCall: ToolCall) => ToolCall.type;
    const getSecondaryText = (ToolCall: ToolCall) => ToolCall.function.name || 'N/A';

    return (
        <EnhancedShortListView<ToolCall>
            items={items as ToolCall[]}
            item={item as ToolCall}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default ToolCallShortListView;