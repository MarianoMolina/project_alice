import { Box, IconButton, Typography } from "@mui/material";
import { CollectionName, CollectionPopulatedType } from "../../../types/CollectionTypes";
import EntityActionsMenu from "../entity_menu/EntityActionsMenu";
import useStyles from "./EnhancedStyles";
import TaskCapabilitiesDialog from "../../enhanced/task/task_dialog/TaskTypeDialog";
import { useState } from "react";
import { Info } from "@mui/icons-material";
import AgentOverviewDialog from "../../enhanced/agent/agent_dialog/AgentDescriptionDialog";
import ChatDescriptionDialog from "../../enhanced/chat/chat_dialog/ChatDescriptionDialog";
import APICapabilitiesDialog from "../../enhanced/api/api_dialog/ApiCapabilitiesDialog";

interface CardTitleProps<T extends CollectionName> {
    title: string;
    elementType?: string;
    item?: CollectionPopulatedType[T];
    itemType?: T;
    onDelete?: () => void;
    actions?: { edit: boolean, download: boolean, copy: boolean, delete: boolean, duplicate: boolean };
}

const CardTitle = <T extends CollectionName>({
    title,
    elementType,
    item,
    itemType,
    onDelete,
    actions = {
        edit: true,
        download: true,
        duplicate: true,
        copy: true,
        delete: true
    }
}: CardTitleProps<T>) => {
    const classes = useStyles();
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [showAgentOverview, setShowAgentOverview] = useState(false);
    const [showChatDescription, setShowChatDescription] = useState(false);
    const [showAPICapabilities, setShowAPICapabilities] = useState(false);
    const selectedTaskType = item && 'task_type' in item ? item.task_type : undefined;

    return (

        <Box className={classes.titleContainer}>
            {elementType && (
                <Typography variant="caption" className={classes.elementType}>
                    {elementType}
                </Typography>
            )}
            <Box className={classes.titleContent}>
                <Typography variant="h5" className={classes.title}>
                    {title}
                    {elementType && elementType === 'Task' && selectedTaskType && (
                        <IconButton onClick={() => setShowTaskDetails(true)}>
                            <Info />
                        </IconButton>
                    )}
                    {elementType && elementType === 'Agent' && (
                        <IconButton onClick={() => setShowAgentOverview(true)} >
                            <Info/>
                        </IconButton>
                    )}
                    {elementType && elementType === 'Chat' && (
                        <IconButton onClick={() => setShowChatDescription(true)} >
                            <Info/>
                        </IconButton>
                    )}
                    {elementType && elementType === 'API' && (
                        <IconButton onClick={() => setShowAPICapabilities(true)} >
                            <Info/>
                        </IconButton>
                    )}
                </Typography>
                {item && itemType && (
                    <Box className={classes.downloadButton}>
                        <EntityActionsMenu item={item} itemType={itemType} onDelete={onDelete} actions={actions}/>
                    </Box>
                )}
            </Box>
            <TaskCapabilitiesDialog
                open={showTaskDetails}
                onClose={() => setShowTaskDetails(false)}
                taskType={selectedTaskType}
            />
            <AgentOverviewDialog
                open={showAgentOverview}
                onClose={() => setShowAgentOverview(false)}
            />
            <ChatDescriptionDialog
                open={showChatDescription}
                onClose={() => setShowChatDescription(false)}
            />
            <APICapabilitiesDialog
                open={showAPICapabilities}
                onClose={() => setShowAPICapabilities(false)}
            />
        </Box>

    );
};

export default CardTitle;