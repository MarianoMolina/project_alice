import React from 'react';
import { AgentComponentProps, AliceAgent } from '../../../../types/AgentTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const AgentShortListView: React.FC<AgentComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (agent: AliceAgent) => agent.name;
    const getSecondaryText = (agent: AliceAgent) => agent.system_message?.name || 'No system message';

    return (
        <EnhancedShortListView<AliceAgent>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default AgentShortListView;