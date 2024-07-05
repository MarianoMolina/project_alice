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
import { Visibility } from '@mui/icons-material';
import { Prompt, PromptComponentProps } from '../../../utils/PromptTypes';

const PromptListView: React.FC<PromptComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((prompt: Prompt) => (
                <ListItem key={prompt._id}>
                    <ListItemText
                        primary={prompt.name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Templated: {prompt.is_templated || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(prompt.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {isInteractable && onInteraction && (
                            <Tooltip title="View Agent">
                                <IconButton edge="end" onClick={() => onInteraction(prompt)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default PromptListView;