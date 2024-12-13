import React from 'react';
import { AliceTask, TaskComponentProps, taskTypeIcons } from '../../../../types/TaskTypes';
import { IconButton, Tooltip, Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { Functions } from '@mui/icons-material';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';

const TaskListView: React.FC<TaskComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task: AliceTask) => task.task_name;
    const getSecondaryText = (task: AliceTask) => (
        <>
            <Tooltip title={formatCamelCaseString(task.task_type)}>
                <IconButton size="small">
                    {taskTypeIcons[task.task_type] || <Functions />}
                </IconButton>
            </Tooltip>
            <Typography component="span" variant="body2" color="textPrimary">
                {task.task_description || 'N/A'}
            </Typography>
        </>
    );

    return (
        <EnhancedListView<AliceTask>
            items={items as AliceTask[]}
            item={item as AliceTask}
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