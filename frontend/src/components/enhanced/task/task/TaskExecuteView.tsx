import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, IconButton, CircularProgress,
    Typography, Alert, Box, Button, Dialog, DialogContent, Tooltip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import { AliceTask, TaskComponentProps } from '../../../../types/TaskTypes';
import { useTask } from '../../../../contexts/TaskContext';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import useStyles from '../TaskStyles';
import TaskResponseList from '../../task_response/task_response/TaskResponseListView';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { DataObject } from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import ParameterInputFields from '../../parameter/ParameterInputFields';

const TaskExecuteView: React.FC<TaskComponentProps> = ({
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
    const { selectCardItem, selectPromptParsedDialog } = useCardDialog();
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

    if (!item) return <Typography>No task data available.</Typography>;

    const handleInputChange = (key: string, value: string | boolean | number) => {
        taskHandleInputChange(key, value.toString());
    };

    const executeTask = async (inputs: any) => {
        if (!item || !onExecute) return;
        setSelectedTask(item as AliceTask);
        setInputValues(inputs);
        await onExecute();
    };

    const handleViewTask = () => {
        if (item._id) {
            selectCardItem('Task', item._id);
        }
    };

    const handleViewResults = () => {
        setIsResultsDialogOpen(true);
    };

    const handleCloseResultsDialog = () => {
        setIsResultsDialogOpen(false);
    };

    const handleViewPrompt = () => {
        taskTemplate && selectPromptParsedDialog(taskTemplate, systemTemplate, inputValues, { user_data: user });
    };

    return (
        <Card className={classes.taskCard}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h6">{formatCamelCaseString(item.task_name)}</Typography>
                    <Box>
                        {taskTemplate && (
                            <Tooltip title="View task template with current inputs">
                                <IconButton
                                    color="default"
                                    onClick={handleViewPrompt}
                                    size="small"
                                    aria-label="view task template"
                                >
                                    <DataObject />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="View task details">
                            <IconButton
                                color="default"
                                onClick={handleViewTask}
                                size="small"
                                aria-label="view task details"
                            >
                                <VisibilityIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="View task execution history">
                            <IconButton
                                color="default"
                                onClick={handleViewResults}
                                size="small"
                                aria-label="view task results"
                            >
                                <HistoryIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Typography variant="body2" mb={2}>{item.task_description || ''}</Typography>

                {item.input_variables && (
                    <ParameterInputFields
                        parameters={item.input_variables}
                        values={inputValues}
                        onChange={handleInputChange}
                        title="Task Parameters"
                        className={classes.inputField}
                    />
                )}

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
                <div className={classes.progressContainer}>
                    {executionStatus === 'success' && (
                        <Alert severity="success" className={classes.successMessage}>Task executed successfully!</Alert>
                    )}
                </div>
            </CardContent>

            {/* Results Dialog */}
            <Dialog open={isResultsDialogOpen} onClose={handleCloseResultsDialog} maxWidth="sm" fullWidth>
                <Box className={classes.dialogTitleContainer}>
                    <Typography variant="h4" className={classes.dialogTitleText}>Task Execution History</Typography>
                </Box>
                <DialogContent className={classes.dialogContent}>
                    {taskResults.length === 0 && (
                        <Typography variant="body2" className={classes.noResultsText}>No task results found for this task.</Typography>
                    )}
                    <TaskResponseList
                        items={getTaskResultsById(item._id || '')}
                        item={null}
                        onView={(taskResult) => selectCardItem('TaskResponse', taskResult._id || '')}
                        onChange={() => { }}
                        mode={'view'}
                        handleSave={async () => { }}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default TaskExecuteView;