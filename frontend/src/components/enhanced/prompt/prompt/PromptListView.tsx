import React from 'react';
import { Prompt, PromptComponentProps } from '../../../../types/PromptTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const PromptListView: React.FC<PromptComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (prompt: Prompt) => prompt.name;
    const getSecondaryText = (prompt: Prompt) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Created: {new Date(prompt.createdAt || '').toLocaleString()}
        </Typography>
    );

    return (
        <EnhancedListView<Prompt>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Agent"
            viewTooltip="View Agent"
        />
    );
};

export default PromptListView;