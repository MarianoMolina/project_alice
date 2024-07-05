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
import { Category, LibraryBooks } from '@mui/icons-material';
import { AgentComponentProps } from '../../../utils/AgentTypes';

const AgentCardView: React.FC<AgentComponentProps> = ({
    item,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2">Model: {item.model?.model_name}</Typography>
                <Typography variant="body2">Execute Code: {item.code_execution_config ? 'Yes' : 'No'}</Typography>
                <Typography variant="caption">
                    Agent ID: {item._id}
                </Typography>
                <List>
                    <ListItemButton>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Agent Type" secondary={item.autogen_class} />
                    </ListItemButton>
                    <ListItemButton>
                        <ListItemIcon><LibraryBooks /></ListItemIcon>
                        <ListItemText
                            primary="System message"
                            secondary={item.system_message.content || ''}
                        />
                    </ListItemButton>

                </List>
            </CardContent>
        </Card>
    );
};

export default AgentCardView;