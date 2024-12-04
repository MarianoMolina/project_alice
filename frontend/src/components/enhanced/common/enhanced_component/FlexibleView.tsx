import React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
} from '@mui/material';
import useStyles from './EnhancedStyles';
import { CollectionName, CollectionType } from '../../../../types/CollectionTypes';
import { DownloadEntity } from '../entity_menu/DownloadEntity';
import { DeleteEntity } from '../entity_menu/DeleteEntity';
import Logger from '../../../../utils/Logger';
import EntityActionsMenu from '../entity_menu/EntityActionsMenu';

interface GenericFlexibleViewProps <T extends CollectionName> {
    title: string;
    elementType?: string;
    children: React.ReactNode;
    onSave?: () => void;
    onDelete?: () => void;
    saveButtonText?: string;
    isEditMode?: boolean;
    item?: CollectionType[T];
    itemType?: T;
}

const GenericFlexibleView = <T extends CollectionName>({
    title,
    elementType,
    children,
    onSave,
    onDelete,
    saveButtonText = 'Save',
    isEditMode = false,
    item, 
    itemType, 
}: GenericFlexibleViewProps<T>) => {
    const classes = useStyles();

    const deleteItem = () => {
        Logger.debug('GenericFlexibleView - deleteItem', { item });
        if (onDelete) {
            onDelete();
        }
    }
    return (
        <Paper className={classes.flexibleViewContainer}>
            <Box className={classes.titleContainer}>
                {elementType && (
                    <Typography variant="caption" className={classes.elementTypeText}>
                        {elementType}
                    </Typography>
                )}
                <Box className={classes.titleContent}>
                    <Typography variant="h5" className={classes.title}>
                        {title}
                    </Typography>
                    {item && itemType && (
                        <Box className={classes.downloadButton}>
                            <EntityActionsMenu item={item} itemType={itemType} onDelete={deleteItem} actions={{edit: false, copy: true, delete: true, download: true}}/>
                        </Box>
                    )}
                </Box>
            </Box>
            <Box className={classes.formContainer}>
                {children}
            </Box>
            {isEditMode && onSave && (
                <Box className={classes.buttonContainer}>
                    <Button variant="contained" color="primary" onClick={onSave}>
                        {saveButtonText}
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default GenericFlexibleView;