import React from 'react';
import {
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
    Box,
    Chip,
    ListItem,
} from '@mui/material';
import { Category, LibraryBooks, AddCircleOutline, Functions, SupportAgent, Code, ApiRounded, Sos } from '@mui/icons-material';
import FunctionDefinitionBuilder from '../../common/function_select/Function';
import { TaskComponentProps } from '../../../../types/TaskTypes';
import useStyles from '../TaskStyles';

const TaskCardView: React.FC<TaskComponentProps> = ({
    item,
    handleAgentClick,
    handleTaskClick,
    handlePromptClick,
    handleModelClick,
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No task data available.</Typography>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" className={classes.title}>{item.task_name}</Typography>
                <Typography variant="subtitle1">{item.task_description}</Typography>
                <Typography variant="caption" className={classes.taskId}>
                    Task ID: {item._id}
                </Typography>
                <List>
                    <ListItem>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Task Type" secondary={item.task_type} />
                    </ListItem>
                    {item.agent && handleAgentClick && (
                        <ListItemButton onClick={() => handleAgentClick(item.agent!._id!)}>
                            <ListItemIcon><SupportAgent /></ListItemIcon>
                            <ListItemText primary="Agent" secondary={item.agent.name} />
                        </ListItemButton>
                    )}
                    {item.model_id && handleModelClick && (
                        <ListItemButton onClick={() => handleModelClick(item.model_id!._id!)}>
                            <ListItemIcon><Code /></ListItemIcon>
                            <ListItemText primary="Model" secondary={item.model_id.short_name} />
                        </ListItemButton>
                    )}
                    <ListItem>
                        <ListItemIcon><LibraryBooks /></ListItemIcon>
                        <ListItemText
                            primary="Templates"
                            secondary={
                                <Box>
                                    {Object.entries(item.templates || {}).map(([key, prompt]) => (
                                        <Chip
                                            key={key}
                                            label={key}
                                            onClick={() => handlePromptClick && prompt && handlePromptClick(prompt._id!)}
                                            className={classes.chip}
                                        />
                                    ))}
                                </Box>
                            }
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><AddCircleOutline /></ListItemIcon>
                        <ListItemText
                            primary="Prompts to Add"
                            secondary={
                                <Box>
                                    {Object.entries(item.prompts_to_add || {}).map(([key, prompt]) => (
                                        <Chip
                                            key={key}
                                            label={key}
                                            onClick={() => handlePromptClick && handlePromptClick(prompt._id!)}
                                            className={classes.chip}
                                        />
                                    ))}
                                </Box>
                            }
                        />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Functions /></ListItemIcon>
                        <ListItemText
                            primary="Subtasks"
                            secondary={
                                <Box>
                                    {Object.entries(item.tasks || {}).map(([key, task]) => (
                                        <Chip
                                            key={key}
                                            label={key}
                                            onClick={() => handleTaskClick && handleTaskClick(task._id!)}
                                            className={classes.chip}
                                        />
                                    ))}
                                </Box>
                            }
                        />
                    </ListItem>
                    {item.required_apis && (
                        <ListItem>
                            <ListItemIcon><ApiRounded /></ListItemIcon>
                            <ListItemText
                                primary="Required APIs"
                                secondary={item.required_apis.join(", ")}
                            />
                        </ListItem>
                    )}
                </List>
                <Box>
                    <Typography gutterBottom>Input Parameters</Typography>
                    <FunctionDefinitionBuilder
                        initialParameters={item.input_variables || undefined}
                        isViewOnly={true}
                    />
                </Box>
                <Box className={classes.exitCodesContainer}>
                    <Typography gutterBottom>Exit Codes</Typography>
                    {Object.entries(item.exit_codes || {}).map(([code, description]) => (
                        <Chip
                            key={code}
                            label={`${code}: ${description}`}
                            className={classes.exitCodeChip}
                        />
                    ))}
                </Box>
                <ListItem>
                    <ListItemIcon><Sos /></ListItemIcon>
                    <ListItemText primary="Human Input Required" secondary={item.human_input ? 'Yes' : 'No'} />
                </ListItem>
            </CardContent>
        </Card>
    );
};

export default TaskCardView;