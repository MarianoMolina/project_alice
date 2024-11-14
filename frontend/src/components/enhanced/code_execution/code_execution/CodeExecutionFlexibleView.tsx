import React, { useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';
import { CodeExecutionComponentProps, CodeExecution, getDefaultCodeExecutionForm } from '../../../../types/CodeExecutionTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../CodeExecutionStyles';

const CodeExecutionFlexibleView: React.FC<CodeExecutionComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultCodeExecutionForm());
        }
        Logger.debug('CodeExecutionFlexibleView', 'item', item);
        Logger.debug('CodeExecutionFlexibleView', getDefaultCodeExecutionForm());
    }, [item, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New CodeExecution' : mode === 'edit' ? 'Edit CodeExecution' : 'CodeExecution Details';
    const saveButtonText = item?._id ? 'Update CodeExecution' : 'Create CodeExecution';

    return (
        <GenericFlexibleView
            elementType='CodeExecution'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as CodeExecution}
            itemType='codeexecutions'
        >
            <Typography variant='h6'>Code Block</Typography>
        </GenericFlexibleView>
    );
};

export default CodeExecutionFlexibleView;