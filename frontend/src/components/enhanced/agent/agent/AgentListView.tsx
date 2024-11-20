import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { AliceAgent, AgentComponentProps } from '../../../../types/AgentTypes';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { apiNameIcons } from '../../../../utils/ApiUtils';
import { Api } from '@mui/icons-material';

const AgentListView: React.FC<AgentComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (agent: AliceAgent) => agent.name;
    const getSecondaryText = (agent: AliceAgent) => (
        <Box display="flex" alignItems="center">
            {agent.models?.chat && (
                <Tooltip title={`Chat model API: ${agent.models?.chat.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.chat.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.embeddings && (
                <Tooltip title={`Embeddings model API: ${agent.models?.embeddings.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.embeddings.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.img_gen && (
                <Tooltip title={`Image generation model API: ${agent.models?.img_gen.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.img_gen.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.stt && (
                <Tooltip title={`Speech-to-text model API: ${agent.models?.stt.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.stt.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.tts && (
                <Tooltip title={`Text-to-speech model API: ${agent.models?.tts.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.tts.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.vision && (
                <Tooltip title={`Vision model API: ${agent.models?.vision.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.vision.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
            {agent.models?.instruct && (
                <Tooltip title={`Instruction model API: ${agent.models?.instruct.api_name}`}>
                    <IconButton size="small">
                        {apiNameIcons[agent.models?.instruct.api_name] || <Api />}
                    </IconButton>
                </Tooltip>
            )}
        </Box>
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