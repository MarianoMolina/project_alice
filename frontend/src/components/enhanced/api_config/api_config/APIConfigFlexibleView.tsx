import React, { useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';
import { APIConfigComponentProps, APIConfig, getDefaultAPIConfigForm } from '../../../../types/ApiConfigTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../APIConfigStyles';

const APIConfigFlexibleView: React.FC<APIConfigComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultAPIConfigForm());
        }
        Logger.debug('APIConfigFlexibleView', 'item', item);
        Logger.debug('APIConfigFlexibleView', getDefaultAPIConfigForm());
    }, [item, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New APIConfig' : mode === 'edit' ? 'Edit APIConfig' : 'APIConfig Details';
    const saveButtonText = item?._id ? 'Update APIConfig' : 'Create APIConfig';

    return (
        <GenericFlexibleView
            elementType='APIConfig'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as APIConfig}
            itemType='apiconfigs'
        >
            <Typography variant="h6" className={classes.titleText}>Type</Typography>
        </GenericFlexibleView>
    );
};

export default APIConfigFlexibleView;