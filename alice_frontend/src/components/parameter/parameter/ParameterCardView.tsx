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
import { ParameterComponentProps } from '../../../utils/ParameterTypes';

const ParameterCardView: React.FC<ParameterComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Description: {item.description}</Typography>
                <Typography variant="body2">Type: {item.type}</Typography>
                <Typography variant="caption">
                    Model ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Created at" secondary={new Date(item.createdAt || '').toDateString()} />
                    </ListItemButton>
                </List>
            </CardContent>
        </Card>
    );
};

export default ParameterCardView;