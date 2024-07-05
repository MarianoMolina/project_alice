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
import { ParameterDefinition, ParameterComponentProps } from '../../../utils/ParameterTypes';

const ParameterListView: React.FC<ParameterComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((parameter: ParameterDefinition) => (
                <ListItem key={parameter._id}>
                    <ListItemText
                        primary={parameter.description}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Type: {parameter.type || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(parameter.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {isInteractable && onInteraction && (
                            <Tooltip title="View Agent">
                                <IconButton edge="end" onClick={() => onInteraction(parameter)}>
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

export default ParameterListView;