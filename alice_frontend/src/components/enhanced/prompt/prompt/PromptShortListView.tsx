import React from 'react';
import { Prompt, PromptComponentProps } from '../../../../utils/PromptTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const PromptShortListView: React.FC<PromptComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (prompt: Prompt) => prompt.name;
    const getSecondaryText = (prompt: Prompt) => new Date(prompt.createdAt || '').toLocaleString() || 'N/A';

    return (
        <EnhancedShortListView<Prompt>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default PromptShortListView;