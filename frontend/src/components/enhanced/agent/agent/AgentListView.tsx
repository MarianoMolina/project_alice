import React from 'react';
import { Typography } from '@mui/material';
import { AliceAgent, AgentComponentProps } from '../../../../types/AgentTypes';
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
            Chat model: {agent.models?.chat?.model_name || 'N/A'}
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
            collectionElementString='Agent'
        />
    );
};

export default AgentListView;