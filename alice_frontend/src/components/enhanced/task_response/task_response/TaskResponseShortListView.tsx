import React from 'react';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { TaskResponse, TaskResponseComponentProps } from '../../../../types/TaskResponseTypes';

const TaskResponseShortList: React.FC<TaskResponseComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task_response: TaskResponse) => task_response.task_name;
    const getSecondaryText = (task_response: TaskResponse) => task_response.status || 'N/A';

    return (
        <EnhancedShortListView<TaskResponse>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default TaskResponseShortList;