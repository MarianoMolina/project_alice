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
import { ModelComponentProps } from '../../../../utils/ModelTypes';
import { AliceModel } from '../../../../utils/ModelTypes';
const ModelCardView: React.FC<ModelComponentProps> = ({
    item,
}: { item: AliceModel | null }) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{item.model_name}</Typography>
                <Typography variant="body2">Deployment: {item.deployment}</Typography>
                <Typography variant="body2">Context size: {item.ctx_size || ''}</Typography>
                <Typography variant="caption">
                    Model ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="API" secondary={item.api_name} />
                    </ListItemButton>
                </List>
            </CardContent>
        </Card>
    );
};

export default ModelCardView;