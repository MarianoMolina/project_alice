import React from 'react';
import {
    Typography,
    Box,
    Chip,
    ListItemButton,
} from '@mui/material';
import { Category, Description, Functions, Person, Code, ApiRounded, Sos, Settings, Logout } from '@mui/icons-material';
import { TaskComponentProps } from '../../../../types/TaskTypes';
import useStyles from '../TaskStyles';
import CommonCardView from '../../common/enhanced_component/CardView';

const TaskCardView: React.FC<TaskComponentProps> = ({
    item,
    handleAgentClick,
    handleTaskClick,
    handlePromptClick,
    handleModelClick,
    handleParameterClick,
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No task data available.</Typography>;
    }

    const listItems = [
        {
            icon: <Category />,
            primary_text: "Task Type",
            secondary_text: item.task_type
        },
        ...(item.agent && handleAgentClick ? [{
            icon: <Person />,
            primary_text: "Agent",
            secondary_text: (
                <ListItemButton onClick={() => handleAgentClick(item.agent!._id!)}>
                    {item.agent.name}
                </ListItemButton>
            )
        }] : []),
        ...(item.model_id && handleModelClick ? [{
            icon: <Code />,
            primary_text: "Model",
            secondary_text: (
                <ListItemButton onClick={() => handleModelClick(item.model_id!._id!)}>
                    {item.model_id.short_name}
                </ListItemButton>
            )
        }] : []),
        {
            icon: <Description />,
            primary_text: "Templates",
            secondary_text: (
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
            )
        },
        {
            icon: <Description />,
            primary_text: "Prompts to Add",
            secondary_text: (
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
            )
        },
        {
            icon: <Functions />,
            primary_text: "Subtasks",
            secondary_text: (
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
            )
        },
        ...(item.required_apis ? [{
            icon: <ApiRounded />,
            primary_text: "Required APIs",
            secondary_text: item.required_apis.join(", ")
        }] : []),
        ...(item.input_variables ? [{
            icon: <Settings />,
            primary_text: "Input Variables",
            secondary_text: (
                <Box onClick={(e) => e.stopPropagation()}>
                    {Object.entries(item.input_variables.properties).map(([key, param]) => (
                        <Chip
                            key={key}
                            label={`${key}: ${param.type}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (handleParameterClick && param._id) {
                                    handleParameterClick(param._id);
                                }
                            }}
                            className={classes.chip}
                            color={item.input_variables?.required.includes(key) ? "primary" : "default"}
                        />
                    ))}
                </Box>
            )
        }] : []),
        {
            icon: <Logout />,
            primary_text: "Exit Codes",
            secondary_text: (
                <Box>
                    {Object.entries(item.exit_codes || {}).map(([code, description]) => (
                        <Chip
                            key={code}
                            label={`${code}: ${description}`}
                            className={classes.exitCodeChip}
                        />
                    ))}
                </Box>
            )
        },
        {
            icon: <Sos />,
            primary_text: "Human Input Required",
            secondary_text: item.human_input ? 'Yes' : 'No'
        }
    ];

    return (
        <CommonCardView
            title={item.task_name}
            subtitle={item.task_description}
            id={item._id}
            listItems={listItems}
        />
    );
};

export default TaskCardView;