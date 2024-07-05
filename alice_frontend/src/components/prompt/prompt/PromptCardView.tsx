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
import { PromptComponentProps } from '../../../utils/PromptTypes';

const PromptCardView: React.FC<PromptComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">Name: {item.name}</Typography>
                <Typography variant="body2">Content: {item.content}</Typography>
                <Typography variant="body2">Templated: {item.is_templated}</Typography>
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

export default PromptCardView;