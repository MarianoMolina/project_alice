import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { AliceAgent, AgentComponentProps } from '../../../utils/AgentTypes';

const AgentListView: React.FC<AgentComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
    onAddAgent,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((agent: AliceAgent) => (
                <ListItem key={agent._id}>
                    <ListItemText
                        primary={agent.name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Model: {agent.model?.model || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(agent.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {isInteractable && onInteraction && (
                            <Tooltip title="View Agent">
                                <IconButton edge="end" onClick={() => onInteraction(agent)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                        {onAddAgent && (
                            <Tooltip title="Add Agent">
                                <IconButton edge="end" onClick={() => onAddAgent(agent)}>
                                    <ChevronRight />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default AgentListView;