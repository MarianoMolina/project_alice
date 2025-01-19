import React from 'react';
import { AliceTask, TaskComponentProps } from '../../../../types/TaskTypes';
import { IconButton, Typography } from '@mui/material';
import EnhancedListView from '../../../common/enhanced_component/ListView';
import { Functions } from '@mui/icons-material';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { taskDescriptions } from '../../../../utils/TaskUtilts';

const TaskListView: React.FC<TaskComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task: AliceTask) => task.task_name;
    const getSecondaryText = (task: AliceTask) => (
        <>
            <IconButton size="small" title={formatCamelCaseString(task.task_type)}>
                {taskDescriptions[task.task_type].icon || <Functions />}
            </IconButton>
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