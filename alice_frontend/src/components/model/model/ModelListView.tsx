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
import { AliceModel, ModelComponentProps } from '../../../utils/ModelTypes';

const ModelListView: React.FC<ModelComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
}) => {
    if (!items) return null;
    return (
        <List>
            {items.map((model: AliceModel) => (
                <ListItem key={model._id}>
                    <ListItemText
                        primary={model.model_name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Deployment: {model.deployment || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(model.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                    <Box>
                        {isInteractable && onInteraction && (
                            <Tooltip title="View Model">
                                <IconButton edge="end" onClick={() => onInteraction(model)}>
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

export default ModelListView;