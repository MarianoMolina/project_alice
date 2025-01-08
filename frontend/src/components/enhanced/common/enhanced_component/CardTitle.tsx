import { Box, IconButton, Typography } from "@mui/material";
import { CollectionName, CollectionPopulatedType } from "../../../../types/CollectionTypes";
import EntityActionsMenu from "../entity_menu/EntityActionsMenu";
import useStyles from "./EnhancedStyles";
import TaskCapabilitiesDialog from "../../task/TaskTypeDialog";
import { useState } from "react";
import { Info } from "@mui/icons-material";

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

                        <IconButton>
                            <Info onClick={() => setShowTaskDetails(true)} />
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
        </Box>

    );
};

export default CardTitle;