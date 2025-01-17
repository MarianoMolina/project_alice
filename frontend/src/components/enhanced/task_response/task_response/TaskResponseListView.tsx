import React from 'react';
import { TaskResponse, TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';
import { Chip, Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';

const TaskResponseListView: React.FC<TaskResponseComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task_response: TaskResponse) => task_response.task_name;
    const getSecondaryText = (task_response: TaskResponse) => (
        <>
            <Typography component="span" variant="body2" color="text.primary">
                {task_response.task_description}
            </Typography>
            <Typography component="div" variant="caption" color="text.secondary">
                Created: {new Date(task_response.createdAt || '').toLocaleString()}
            </Typography>
            <Chip
                label={task_response.status}
                color={task_response.status === 'complete' ? 'success' : task_response.status === 'failed' ? 'error' : 'default'}
                size="small"
                sx={{ ml: 1 }}
            />
        </>
    );

    return (
        <EnhancedListView<TaskResponse>
            items={items as TaskResponse[]}
            item={item as TaskResponse}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Task Response"
            viewTooltip="View Task Response"
            collectionElementString='TaskResponse'
        />
    );
};

export default TaskResponseListView;