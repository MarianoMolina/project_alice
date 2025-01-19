import React from 'react';
import { Box, IconButton } from '@mui/material';
import { AliceAgent, AgentComponentProps } from '../../../../types/AgentTypes';
import EnhancedListView from '../../../common/enhanced_component/ListView';
import { apiNameIcons } from '../../../../utils/ApiUtils';
import { Api } from '@mui/icons-material';
import { PermissionIcon } from '../PermissionIcons';

const AgentListView: React.FC<AgentComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (agent: AliceAgent) => agent.name;

    const getSecondaryText = (agent: AliceAgent) => (
        <Box display="flex" alignItems="center" gap={1}>
            <PermissionIcon
                permission={agent.has_tools}
                type="tool"
            />
            <PermissionIcon
                permission={agent.has_code_exec}
                type="code"
            />
            {agent.models?.chat && (
                <IconButton size="small" title={`Chat model API: ${agent.models?.chat.api_name}`}>
                    {apiNameIcons[agent.models?.chat.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.embeddings && (
                <IconButton size="small" title={`Embeddings model API: ${agent.models?.embeddings.api_name}`}>
                    {apiNameIcons[agent.models?.embeddings.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.img_gen && (
                <IconButton size="small" title={`Image generation model API: ${agent.models?.img_gen.api_name}`}>
                    {apiNameIcons[agent.models?.img_gen.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.stt && (
                <IconButton size="small" title={`Speech-to-text model API: ${agent.models?.stt.api_name}`}>
                    {apiNameIcons[agent.models?.stt.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.tts && (
                <IconButton size="small" title={`Text-to-speech model API: ${agent.models?.tts.api_name}`}>
                    {apiNameIcons[agent.models?.tts.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.vision && (
                <IconButton size="small" title={`Vision model API: ${agent.models?.vision.api_name}`}>
                    {apiNameIcons[agent.models?.vision.api_name] || <Api />}
                </IconButton>
            )}
            {agent.models?.instruct && (
                <IconButton size="small" title={`Instruction model API: ${agent.models?.instruct.api_name}`}>
                    {apiNameIcons[agent.models?.instruct.api_name] || <Api />}
                </IconButton>
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