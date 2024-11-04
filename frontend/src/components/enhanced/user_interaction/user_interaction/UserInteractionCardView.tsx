import React from 'react';
import {
    Typography,
} from '@mui/material';
import { Language, Description, QueryBuilder, DataObject, Functions } from '@mui/icons-material';
import { UserInteractionComponentProps } from '../../../../types/UserInteractionTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const UserInteractionCardView: React.FC<UserInteractionComponentProps> = ({
    item
}) => {

    if (!item) {
        return <Typography>No User Interaction data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Language />,
            primary_text: "User Prompt",
            secondary_text: item.user_checkpoint_id.user_prompt || 'No user prompt available'
        },
        {
            icon: <Functions />,
            primary_text: "Task Response",
            secondary_text: item.task_response_id ? `${item.task_response_id.task_name} - ${item.task_response_id._id}` : 'No task response available'
        },
        {
            icon: <DataObject />,
            primary_text: "User Choice",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.user_response, null, 2)} />
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='User Interaction'
            title={'User Interaction Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='userinteractions'
        >
        </CommonCardView>
    );
};

export default UserInteractionCardView;