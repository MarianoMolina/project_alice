import React from 'react';
import {
    Typography,
    ListItemButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { Category, LibraryBooks, Code, Build, ChatBubbleOutline } from '@mui/icons-material';
import { AgentComponentProps, mapCodePermission, mapToolPermission } from '../../../../types/AgentTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { ModelType } from '../../../../types/ModelTypes';
import { useCardDialog } from '../../../../contexts/CardDialogContext';

const AgentCardView: React.FC<AgentComponentProps> = ({
    item,
}) => {
    const { selectCardItem } = useCardDialog();
    if (!item) {
        return <Typography>No agent data available.</Typography>;
    }

    const modelListItems = item.models ? Object.entries(item.models).map(([modelType, model]) => (
        <ListItem key={modelType} disablePadding>
            <ListItemButton onClick={() => model._id && selectCardItem && selectCardItem('Model', model._id, model)}>
                <ListItemIcon>
                    <Category />
                </ListItemIcon>
                <ListItemText 
                    primary={`${ModelType[modelType as keyof typeof ModelType]} Model`}
                    secondary={model.model_name || 'N/A'}
                />
            </ListItemButton>
        </ListItem>
    )) : [];

    const listItems = [
        {
            icon: <Code />,
            primary_text: "Code Execution",
            secondary_text: `${item.has_code_exec}: ${mapCodePermission(item.has_code_exec)}`
        },
        {
            icon: <Build />,
            primary_text: "Tool Use",
            secondary_text: `${item.has_tools}: ${mapToolPermission(item.has_tools)}`
        },
        {
            icon: <ChatBubbleOutline />,
            primary_text: "Max consecutive replies",
            secondary_text: item.max_consecutive_auto_reply?.toString() ?? 'none'
        },
        {
            icon: <Category />,
            primary_text: "Models",
            secondary_text: (
                <List disablePadding>
                    {modelListItems}
                </List>
            )
        },
        {
            icon: <LibraryBooks />,
            primary_text: "System message",
            secondary_text: (
                <ListItemButton onClick={() => item.system_message?._id && selectCardItem && selectCardItem('Prompt', item.system_message._id, item.system_message)}>
                    {item.system_message?.content || 'N/A'}
                </ListItemButton>
            )
        }
    ];

    return (
        <CommonCardView
            elementType='Agent'
            title={item.name}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='agents'
        />
    );
};

export default AgentCardView;