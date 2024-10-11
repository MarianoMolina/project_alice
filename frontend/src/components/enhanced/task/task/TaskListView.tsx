import React from 'react';
import { AliceTask, TaskComponentProps } from '../../../../types/TaskTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';

const TaskListView: React.FC<TaskComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task: AliceTask) => task.task_name;
    const getSecondaryText = (task: AliceTask) => (
            <>
                <Typography component="span" variant="body2" color="textPrimary">
                    Description: {task.task_description || 'N/A'}
                </Typography>
                <br />
                <Typography component="span" variant="body2" color="textSecondary">
                    Created: {new Date(task.createdAt || '').toLocaleString()}
                </Typography>
            </>
    );

    return (
        <EnhancedListView<AliceTask>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Add Task"
            viewTooltip="View Task"
        />
    );
};

export default TaskListView;