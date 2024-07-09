import React from 'react';
import {
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
} from '@mui/material';
import { Category } from '@mui/icons-material';
import { ModelComponentProps } from '../../../utils/ModelTypes';

const ModelCardView: React.FC<ModelComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{item.model}</Typography>
                <Typography variant="body2">Deployment: {item.deployment}</Typography>
                <Typography variant="body2">Context size: {item.ctx_size || ''}</Typography>
                <Typography variant="caption">
                    Model ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Base url" secondary={item.base_url} />
                    </ListItemButton>
                </List>
            </CardContent>
        </Card>
    );
};

export default ModelCardView;