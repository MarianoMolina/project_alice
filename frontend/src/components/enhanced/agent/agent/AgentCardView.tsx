import React from 'react';
import {
    Typography,
    ListItemButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { Category, LibraryBooks, Code, ChatBubbleOutline, BadgeOutlined, QueryBuilder } from '@mui/icons-material';
import { AgentComponentProps, mapCodePermission, mapToolPermission } from '../../../../types/AgentTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { useDialog } from '../../../../contexts/DialogContext';
import { PermissionIcon } from '../PermissionIcons';
import { modelTypeIcons } from '../../../../utils/ApiUtils';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import AliceMarkdown from '../../../ui/markdown/alice_markdown/AliceMarkdown';

const AgentCardView: React.FC<AgentComponentProps> = ({
    item,
}) => {
    const { selectCardItem } = useDialog();
    if (!item) {
        return <Typography>No agent data available.</Typography>;
    }

    const modelListItems = item.models ? Object.entries(item.models).map(([modelType, model]) => (
        <ListItem key={modelType} disablePadding>
            <ListItemButton onClick={() => model._id && selectCardItem && selectCardItem('Model', model._id, model)}>
                <ListItemIcon>
                    {modelTypeIcons[model.model_type] || <Code />}
                </ListItemIcon>
                <ListItemText
                    primary={`${formatCamelCaseString(model.model_type)} model`}
                    secondary={model.model_name || 'N/A'}
                />
            </ListItemButton>
        </ListItem>
    )) : [];

    const listItems = [
        {
            icon: <BadgeOutlined />,
            primary_text: "Name",
            secondary_text: item.name
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
                <ListItemButton
                    sx={{ padding: '8px 0'}}
                    onClick={() => item.system_message?._id && selectCardItem && selectCardItem('Prompt', item.system_message._id, item.system_message)}
                >
                    <AliceMarkdown>{item.system_message?.content || 'N/A'}</AliceMarkdown>
                </ListItemButton>
            )
        },
        {
            icon: <ChatBubbleOutline />,
            primary_text: "Max consecutive replies",
            secondary_text: item.max_consecutive_auto_reply?.toString() ?? 'none'
        },
        {
            icon:
                <PermissionIcon
                    permission={item.has_tools}
                    type="tool"
                />,
            primary_text: "Tool Use",
            secondary_text: mapToolPermission(item.has_tools)
        },
        {
            icon:
                <PermissionIcon
                    permission={item.has_code_exec}
                    type="code"
                />,
            primary_text: "Code Execution",
            secondary_text: mapCodePermission(item.has_code_exec)
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created At",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
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