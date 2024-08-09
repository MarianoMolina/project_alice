import React from 'react';
import {
    Typography,
    ListItemButton,
} from '@mui/material';
import { Category, LibraryBooks, Code, Build, ChatBubbleOutline } from '@mui/icons-material';
import { AgentComponentProps } from '../../../../types/AgentTypes';
import CommonCardView from '../../common/enhanced_component/CardView';

const AgentCardView: React.FC<AgentComponentProps> = ({
    item,
    handleModelClick,
    handlePromptClick,
}) => {
    if (!item) {
        return <Typography>No agent data available.</Typography>;
    }
    const listItems = [
        { 
            icon: <Code />, 
            primary_text: "Can execute code", 
            secondary_text: item.has_code_exec ? 'Yes' : 'No'
        },
        { 
            icon: <Build />, 
            primary_text: "Can use tools", 
            secondary_text: item.has_functions ? 'Yes' : 'No'
        },
        { 
            icon: <ChatBubbleOutline />, 
            primary_text: "Max consecutive replies", 
            secondary_text: item.max_consecutive_auto_reply ?? 'none'
        },
        { 
            icon: <Category />, 
            primary_text: "Model", 
            secondary_text: (
                <ListItemButton onClick={() => item.model_id?._id && handleModelClick && handleModelClick(item.model_id._id)}>
                    {item.model_id?.model_name || 'N/A'}
                </ListItemButton>
            )
        },
        { 
            icon: <LibraryBooks />, 
            primary_text: "System message", 
            secondary_text: (
                <ListItemButton onClick={() => item.system_message?._id && handlePromptClick && handlePromptClick(item.system_message._id)}>
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
        />
    );
};

export default AgentCardView;