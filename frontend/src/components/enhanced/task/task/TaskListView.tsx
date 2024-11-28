import React from 'react';
import { AliceTask, TaskComponentProps } from '../../../../types/TaskTypes';
import { IconButton, Tooltip, Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { taskTypeIcons } from '../../../../utils/TaskUtils';
import { Functions } from '@mui/icons-material';

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
                    {task.task_description || 'N/A'}
                </Typography>
                <Tooltip title={`Task type: ${task.task_type}`}>
                    <IconButton size="small">
                        {taskTypeIcons[task.task_type] || <Functions />}
                    </IconButton>
                </Tooltip>
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
            collectionElementString='Task'
        />
    );
};

export default TaskListView;