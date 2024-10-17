import React from 'react';
import {
    Typography,
} from '@mui/material';
import { Language, Description, QueryBuilder, DataObject } from '@mui/icons-material';
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
            secondary_text: item.user_prompt || 'No user prompt available'
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
        {
            icon: <Description />,
            primary_text: "Options",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.options_obj, null, 2)} />
        },
        {
            icon: <DataObject />,
            primary_text: "Next task",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.task_next_obj, null, 2)} />
        },
        {
            icon: <DataObject />,
            primary_text: "User Choice",
            secondary_text: <CodeBlock language="json" code={JSON.stringify(item.user_response, null, 2)} />
        }
    ];

    return (
        <CommonCardView
            elementType='URL Reference'
            title={'URL Reference Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='userinteractions'
        >
        </CommonCardView>
    );
};

export default UserInteractionCardView;