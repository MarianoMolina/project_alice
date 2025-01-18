import { memo } from 'react';
import { Box, Typography, List, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import useStyles from '../../../styles/StartTaskStyles';
import { RecentExecution } from '../../../contexts/TaskContext';
import { PopulatedTask } from '../../../types/TaskTypes';
import TaskResponseListView from '../../enhanced/task_response/task_response/TaskResponseListView';

interface RecentExecutionsSectionProps {
    recentExecutions: RecentExecution[];
    selectedTask: PopulatedTask | null;
    onExecutionView: (execution: RecentExecution) => void;
    onExecutionInteraction: (execution: RecentExecution) => void;
}

interface TaskResponseProps {
    execution: RecentExecution;
    onView: () => void;
    onInteraction?: () => void;
}

const MemoizedTaskResponseListView = memo(({ execution, onView, onInteraction }: TaskResponseProps) => (
    <TaskResponseListView
        item={execution.result}
        items={null}
        mode="view"
        onChange={() => null}
        handleSave={async () => { }}
        onView={onView}
        onInteraction={onInteraction}
    />
));

export const RecentExecutionsSection = memo(({
    recentExecutions,
    selectedTask,
    onExecutionView,
    onExecutionInteraction
}: RecentExecutionsSectionProps) => {
    const classes = useStyles();

    return (
        <Accordion
            className={classes.recentExecutionsAccordion}
            defaultExpanded
            classes={{
                root: classes.accordionRoot,
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="recent-executions-content"
                id="recent-executions-header"
                className={classes.recentExecutionsAccordionSummary}
            >
                <Typography variant="h6" className={classes.sectionTitle}>Recent Executions</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.recentExecutionsAccordionDetails}>
                <Box component="div">
                    <List className={classes.recentExecutionsList}>
                        {recentExecutions.map((execution, index) => (
                            <MemoizedTaskResponseListView
                                key={index}
                                execution={execution}
                                onView={() => onExecutionView(execution)}
                                onInteraction={
                                    selectedTask && execution.taskId === selectedTask._id
                                        ? () => onExecutionInteraction(execution)
                                        : undefined
                                }
                            />
                        ))}
                    </List>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
});
