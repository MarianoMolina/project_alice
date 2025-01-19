import React, { useMemo, useState, memo, useCallback } from 'react';
import {
    Card, CardContent, IconButton, CircularProgress,
    Typography, Alert, Box, Button, Dialog, DialogContent} from '@mui/material';
import { DataObject, Visibility, History } from '@mui/icons-material';
import { AliceTask, PopulatedTask } from '../../../types/TaskTypes';
import { formatCamelCaseString } from '../../../utils/StyleUtils';
import { useDialog } from '../../../contexts/DialogContext';
import { useTask } from '../../../contexts/TaskContext';
import { useAuth } from '../../../contexts/AuthContext';
import useStyles from '../../enhanced/task/TaskStyles';
import { LogicFlowIcon } from '../../../utils/CustomIcons';
import ParameterInputFields from '../../enhanced/parameter/ParameterInputFields';
import ApiValidationManager from '../../enhanced/api/ApiValidationManager';
import TaskResponseListView from '../../enhanced/task_response/task_response/TaskResponseListView';

// Props interfaces for memoized components
interface TaskHeaderProps {
    taskName: string;
    taskTemplate: any;
    onViewPrompt: () => void;
    onViewTask: () => void;
    onViewResults: () => void;
    onViewFlow: () => void;
}

interface TaskResultsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    taskResults: any[];
    taskId: string;
    onViewResult: (taskResult: any) => void;
}

// Memoized header component with action buttons
const TaskHeader = memo(({
    taskName,
    taskTemplate,
    onViewPrompt,
    onViewTask,
    onViewResults,
    onViewFlow,
}: TaskHeaderProps) => {

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{formatCamelCaseString(taskName)}</Typography>
            <Box>
                {taskTemplate && (
                    <IconButton
                        color="default"
                        onClick={onViewPrompt}
                        title="View task template with current inputs"
                        size="small"
                        aria-label="view task template"
                    >
                        <DataObject />
                    </IconButton>
                )}
                <IconButton
                    color="default"
                    title="View task flowchart"
                    onClick={onViewFlow}
                    size="small"
                    aria-label="view task flowchart"
                >
                    <LogicFlowIcon />
                </IconButton>
                <IconButton
                    color="default"
                    title="View task details"
                    onClick={onViewTask}
                    size="small"
                    aria-label="view task details"
                >
                    <Visibility />
                </IconButton>
                <IconButton
                    color="default"
                    onClick={onViewResults}
                    title="View task execution history"
                    size="small"
                    aria-label="view task results"
                >
                    <History />
                </IconButton>
            </Box>
        </Box>
    );
});

// Memoized results dialog component
const TaskResultsDialog = memo(({
    isOpen,
    onClose,
    taskResults,
    taskId,
    onViewResult
}: TaskResultsDialogProps) => {
    const classes = useStyles();

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <Box className={classes.dialogTitleContainer}>
                <Typography variant="h4" className={classes.dialogTitleText}>
                    Task Execution History
                </Typography>
            </Box>
            <DialogContent className={classes.dialogContent}>
                {taskResults.length === 0 && (
                    <Typography variant="body2" className={classes.noResultsText}>
                        No task results found for this task.
                    </Typography>
                )}
                <TaskResponseListView
                    items={taskResults}
                    item={null}
                    onView={onViewResult}
                    onChange={() => { }}
                    mode={'view'}
                    handleSave={async () => { }}
                />
            </DialogContent>
        </Dialog>
    );
});

// Memoized parameter fields component
const TaskParameterFields = memo(({
    parameters,
    values,
    onChange
}: {
    parameters: any;
    values: any;
    onChange: (key: string, value: string | boolean | number) => void;
}) => {
    const classes = useStyles();

    return (
        <ParameterInputFields
            title="Task Parameters"
            parameters={parameters}
            values={values}
            onChange={onChange}
            className={classes.inputField}
        />
    );
});
export interface TaskExecuteProps {
    item: AliceTask | PopulatedTask | null;
    onExecute?: () => Promise<any>;
}

const TaskExecuteView: React.FC<TaskExecuteProps> = ({
    item,
    onExecute,
}) => {
    const classes = useStyles();
    const {
        executionStatus,
        inputValues,
        handleInputChange: taskHandleInputChange,
        setSelectedTask,
        setInputValues,
        getTaskResultsById,
    } = useTask();
    const { selectCardItem, selectPromptParsedDialog, selectTaskFlowchartItem } = useDialog();
    const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
    const { user } = useAuth();

    const taskResults = useMemo(() =>
        getTaskResultsById(item?._id || '')
        , [getTaskResultsById, item?._id]);

    const taskTemplate = useMemo(() =>
        item?.templates?.task_template || undefined
        , [item?.templates]);

    const systemTemplate = useMemo(() =>
        item?.agent?.system_message || undefined
        , [item?.agent]);

    const handleInputChange = useCallback((key: string, value: string | boolean | number) => {
        taskHandleInputChange(key, value.toString());
    }, [taskHandleInputChange]);

    const executeTask = useCallback(async (inputs: any) => {
        if (!item || !onExecute) return;
        setSelectedTask(item as PopulatedTask);
        setInputValues(inputs);
        await onExecute();
    }, [item, onExecute, setSelectedTask, setInputValues]);

    const handleViewTask = useCallback(() => {
        if (item?._id) {
            selectCardItem('Task', item._id);
        }
    }, [item?._id, selectCardItem]);

    const handleViewResults = useCallback(() => {
        setIsResultsDialogOpen(true);
    }, []);

    const handleViewFlow = useCallback(() => {
        if (item) {
            selectTaskFlowchartItem(item as PopulatedTask);
        }
    }, [item, selectTaskFlowchartItem]);

    const handleCloseResultsDialog = useCallback(() => {
        setIsResultsDialogOpen(false);
    }, []);

    const handleViewPrompt = useCallback(() => {
        taskTemplate && selectPromptParsedDialog(taskTemplate, systemTemplate, inputValues, { user_data: user });
    }, [taskTemplate, systemTemplate, inputValues, selectPromptParsedDialog, user]);

    const handleViewResult = useCallback((taskResult: any) => {
        selectCardItem('TaskResponse', taskResult._id || '');
    }, [selectCardItem]);

    if (!item) return <Typography>No task data available.</Typography>;

    return (
        <Card className={classes.taskCard}>
            <CardContent>
                <TaskHeader
                    taskName={item.task_name}
                    taskTemplate={taskTemplate}
                    onViewPrompt={handleViewPrompt}
                    onViewTask={handleViewTask}
                    onViewResults={handleViewResults}
                    onViewFlow={handleViewFlow}
                />

                <Typography variant="body2" mb={2}>
                    {item.task_description || ''}
                </Typography>

                {item.input_variables && (
                    <TaskParameterFields
                        parameters={item.input_variables}
                        values={inputValues}
                        onChange={handleInputChange}
                    />
                )}

                <Box className="flex items-center gap-2 mb-1 mt-1">
                    <Typography variant="body2" textAlign={'right'}>API Validation</Typography>
                    <ApiValidationManager taskId={item._id} />
                    <Box className={classes.buttonContainer}>
                        <Button
                            color="primary"
                            onClick={() => executeTask(inputValues)}
                            disabled={executionStatus === 'progress'}
                            size="large"
                        >
                            {executionStatus === 'progress' ? <CircularProgress size={24} /> : 'Execute'}
                        </Button>
                    </Box>
                </Box>


                <div className={classes.progressContainer}>
                    {executionStatus === 'success' && (
                        <Alert severity="success" className={classes.successMessage}>
                            Task executed successfully!
                        </Alert>
                    )}
                </div>
            </CardContent>

            <TaskResultsDialog
                isOpen={isResultsDialogOpen}
                onClose={handleCloseResultsDialog}
                taskResults={taskResults}
                taskId={item._id || ''}
                onViewResult={handleViewResult}
            />
        </Card>
    );
};

export default memo(TaskExecuteView);