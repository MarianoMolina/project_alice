import React from 'react';
import { AliceTask, TaskComponentProps } from '../../../../utils/TaskTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const TaskShortListView: React.FC<TaskComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (task: AliceTask) => task.task_name;
    const getSecondaryText = (task: AliceTask) => task.task_description || 'No description';

    return (
        <EnhancedShortListView<AliceTask>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default TaskShortListView;