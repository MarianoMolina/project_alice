import React from 'react';
import { Typography } from '@mui/material';
import { AliceAgent, AgentComponentProps } from '../../../../utils/AgentTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';

const AgentListView: React.FC<AgentComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (agent: AliceAgent) => agent.name;
    const getSecondaryText = (agent: AliceAgent) => (
        <Typography component="span" variant="body2" color="textSecondary">
            Created: {new Date(agent.createdAt || '').toLocaleString()}
        </Typography>
    );

    return (
        <EnhancedListView<AliceAgent>
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

export default AgentListView;