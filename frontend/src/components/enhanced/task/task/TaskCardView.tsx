import React from 'react';
import {
    Typography,
    Box,
    Chip,
    ListItemButton,
    Tooltip,
    IconButton,
} from '@mui/material';
import { Category, Description, Functions, Person, ApiRounded, Settings, Logout, ExitToApp, AttachFile, Api } from '@mui/icons-material';
import { PopulatedTask, TaskComponentProps, taskDescriptions } from '../../../../types/TaskTypes';
import useStyles from '../TaskStyles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import TaskFlowchart from '../../common/task_flowchart/FlowChart';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import { ApiType } from '../../../../types/ApiTypes';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { APIConfigIcon } from '../../../../utils/CustomIcons';
import ApiValidationManager from '../../api/ApiValidationManager';

interface ChipItem {
    _id?: string;
    [key: string]: any;
}

type ChipRecord = Record<string, ChipItem | null>;

const TaskCardView: React.FC<TaskComponentProps> = ({
    item,
}) => {
    const classes = useStyles();
    const { selectCardItem } = useCardDialog();

    if (!item) {
        return <Typography>No task data available.</Typography>;
    }

    const renderChips = (items: ChipRecord | null | undefined, onClick: (id: string) => void, emptyText: string) => {
        if (!items || Object.keys(items).length === 0) {
            return <Typography variant="body2" color="textSecondary">{emptyText}</Typography>;
        }
        return (
            <Box>
                {Object.entries(items).map(([key, value]) => {
                    if (value === null) return null;
                    return (
                        <Chip
                            key={key}
                            label={`${key}: ${value.name || value.prompt_name || key}`}
                            onClick={() => value._id && onClick(value._id)}
                            className={classes.chip}
                        />
                    );
                })}
            </Box>
        );
    };

    const listItems = [
        {
            icon: <Category />,
            primary_text: "Task Type",
            secondary_text: item.task_type ? (
                <Tooltip title={taskDescriptions[item.task_type]} arrow>
                    <Typography>{item.task_type}</Typography>
                </Tooltip>
            ) : <Typography variant="body2" color="textSecondary">No task type</Typography>
        },
        {
            icon: <Person />,
            primary_text: "Agent",
            secondary_text: (item.agent?.name ?
                <ListItemButton onClick={() => item.agent?._id && selectCardItem && selectCardItem('Agent', item.agent._id, item.agent)}>
                    {item.agent?.name}
                </ListItemButton> : <Typography variant="body2" color="textSecondary">No agent</Typography>
            )
        },
        {
            icon: <Description />,
            primary_text: "Templates",
            secondary_text: renderChips(item.templates as ChipRecord, (id) => selectCardItem && selectCardItem('Prompt', id), "No templates available")
        },
        {
            icon: <Functions />,
            primary_text: "Subtasks",
            secondary_text: renderChips(item.tasks as ChipRecord, (id) => selectCardItem && selectCardItem('Task', id), "No subtasks available")
        },
        {
            icon: <ApiRounded />,
            primary_text: "Required APIs",
            secondary_text: item.required_apis && item.required_apis.length > 0 ? (
                <Box>
                    {item.required_apis.map((api: ApiType) => (
                        <Tooltip key={api} title={formatStringWithSpaces(api)}>
                            <IconButton size="small">
                                {apiTypeIcons[api] || <Api />}
                            </IconButton>
                        </Tooltip>
                    ))}
                </Box>
            ) : "No required APIs"
        },
        {
            icon: <APIConfigIcon />,
            primary_text: "API Validation",
            secondary_text: item._id && item.required_apis && <ApiValidationManager taskId={item._id} />
        },
        {
            icon: <Settings />,
            primary_text: "Input Variables",
            secondary_text: (
                !item.input_variables?.properties || Object.keys(item.input_variables.properties).length === 0 ?
                    <Typography variant="body2" color="textSecondary">No input variables defined</Typography> :
                    <Box onClick={(e) => e.stopPropagation()}>
                        {Object.entries(item.input_variables.properties).map(([key, param]: [string, any]) => (
                            <Chip
                                key={key}
                                label={`${key}: ${param.type}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (selectCardItem && param._id) {
                                        selectCardItem('Parameter', param._id, param);
                                    }
                                }}
                                className={classes.chip}
                                color={item.input_variables?.required?.includes(key) ? "primary" : "default"}
                            />
                        ))}
                    </Box>
            )
        },
        {
            icon: <Logout />,
            primary_text: "Exit Codes",
            secondary_text: (
                !item.exit_codes || Object.keys(item.exit_codes).length === 0 ?
                    <Typography variant="body2" color="textSecondary">No exit codes defined</Typography> :
                    <Box>
                        {Object.entries(item.exit_codes).map(([code, description]) => (
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
            icon: <AttachFile />,
            primary_text: "References",
            secondary_text: item.data_cluster && 
                hasAnyReferences(item.data_cluster as References) ? 
                    <DataClusterManager dataCluster={item.data_cluster as PopulatedDataCluster} /> :
                        <Typography>"N/A"</Typography>,
        },
        {
            icon: <ExitToApp />,
            primary_text: "Task flow",
            secondary_text: (item.node_end_code_routing && Object.keys(item.node_end_code_routing).length > 0) ?
                <TaskFlowchart task={item as PopulatedTask} height={500} minWidth={500} />
                : "No exit code routing defined"
        },
    ];

    return (
        <CommonCardView
            elementType='Task'
            title={formatStringWithSpaces(item.task_name)}
            subtitle={item.task_description}
            id={item._id}
            listItems={listItems}
            item={item as PopulatedTask}
            itemType='tasks'
        />
    );
};

export default TaskCardView;