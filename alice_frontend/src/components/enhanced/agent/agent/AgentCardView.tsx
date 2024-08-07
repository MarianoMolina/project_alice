import React from 'react';
import {
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
    ListItem,
} from '@mui/material';
import { Category, LibraryBooks, Code, Build, ChatBubbleOutline } from '@mui/icons-material';
import { AgentComponentProps } from '../../../../types/AgentTypes';

const AgentCardView: React.FC<AgentComponentProps> = ({
    item,
    handleModelClick,
    handlePromptClick,
}) => {
    if (!item) {
        return <Typography>No chat data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="caption">
                    Agent ID: {item._id}
                </Typography>
                <List>
                    <ListItem>
                        <ListItemIcon><Code /></ListItemIcon>
                        <ListItemText
                            primary="Can execute code"
                            secondary={item.has_code_exec ? 'Yes' : 'No'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Build /></ListItemIcon>
                        <ListItemText
                            primary="Can use tools"
                            secondary={item.has_functions ? 'Yes' : 'No'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><ChatBubbleOutline /></ListItemIcon>
                        <ListItemText
                            primary="Max consecutive replies"
                            secondary={item.max_consecutive_auto_reply ?? 'none'} />
                    </ListItem>
                    <ListItemButton onClick={() => item.model_id?._id && handleModelClick && handleModelClick(item.model_id?._id)}>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText
                            primary="Model"
                            secondary={item.model_id?.model_name} />
                    </ListItemButton>
                    <ListItemButton onClick={() => item.system_message?._id && handlePromptClick && handlePromptClick(item.system_message?._id)}>
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