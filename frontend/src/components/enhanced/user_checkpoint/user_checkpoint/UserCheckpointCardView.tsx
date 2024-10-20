import React from 'react';
import {
    Typography,
} from '@mui/material';
import { Language, Description, QueryBuilder, DataObject } from '@mui/icons-material';
import { UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const UserCheckpointCardView: React.FC<UserCheckpointComponentProps> = ({
    item
}) => {

    if (!item) {
        return <Typography>No User Checkpoint data available.</Typography>;
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
    ];

    return (
        <CommonCardView
            elementType='User Checkpoint'
            title={'User Checkpoint Details'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='usercheckpoints'
        >
        </CommonCardView>
    );
};

export default UserCheckpointCardView;