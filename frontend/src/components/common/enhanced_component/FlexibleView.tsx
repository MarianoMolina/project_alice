import React from 'react';
import {
    Box,
    Button,
    Paper,
} from '@mui/material';
import useStyles from './EnhancedStyles';
import { CollectionName, CollectionPopulatedType } from '../../../types/CollectionTypes';
import CardTitle from './CardTitle';

interface GenericFlexibleViewProps <T extends CollectionName> {
    title: string;
    elementType?: string;
    children: React.ReactNode;
    onSave?: () => void;
    onDelete?: () => void;
    saveButtonText?: string;
    isEditMode?: boolean;
    mode?: 'edit' | 'create' | 'view';
    item?: CollectionPopulatedType[T];
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
    mode = 'edit',
    item, 
    itemType, 
}: GenericFlexibleViewProps<T>) => {
    const classes = useStyles();

    const actions = {
        edit: mode === 'view' ? true : false,
        download: true,
        copy: true,
        duplicate: true,
        delete: mode !== 'create' ? true : false
    };

    return (
        <Paper className={classes.flexibleViewContainer}>
            <CardTitle title={title} elementType={elementType} item={item} itemType={itemType} onDelete={onDelete} actions={actions}/>
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