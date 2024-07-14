import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Switch,
} from '@mui/material';
import { Visibility, Edit } from '@mui/icons-material';
import { API } from '../../../utils/ApiTypes';
import { ApiComponentProps } from '../../../utils/ApiTypes';

const ApiListView: React.FC<ApiComponentProps & { fullList?: boolean }> = ({
    items,
    isInteractable = false,
    onInteraction,
    onView,
    onChange,
    fullList = false,
}) => {
    if (!items) return null;

    const handleToggleActive = (api: API) => {
        if (onChange) {
            onChange({ ...api, is_active: !api.is_active });
        }
    };

    return (
        <List>
            {items.map((api: API) => (
                <ListItem key={api._id}>
                    <ListItemText
                        primary={api.name}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Type: {api.api_type}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Status: {api.health_status}
                                </Typography>
                            </>
                        }
                    />
                    {fullList && (
                        <Switch
                            checked={api.is_active}
                            onChange={() => handleToggleActive(api)}
                            color="primary"
                        />
                    )}
                    <Box>
                        {onView && (
                            <Tooltip title="View API">
                                <IconButton edge="end" onClick={() => onView(api)}>
                                    <Visibility />
                                </IconButton>
                            </Tooltip>
                        )}
                        {fullList && onInteraction && (
                            <Tooltip title="Edit API">
                                <IconButton edge="end" onClick={() => onInteraction(api)}>
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </ListItem>
            ))}
        </List>
    );
};

export default ApiListView;