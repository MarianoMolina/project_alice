import React, { useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';
import { ParameterComponentProps, ParameterDefinition, ParameterTypes, getDefaultParameterForm } from '../../../../types/ParameterTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../ParameterStyles';

const ParameterFlexibleView: React.FC<ParameterComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultParameterForm());
        }
        Logger.debug('ParameterFlexibleView', 'item', item);
        Logger.debug('ParameterFlexibleView', getDefaultParameterForm());
    }, [item, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New Parameter' : mode === 'edit' ? 'Edit Parameter' : 'Parameter Details';
    const saveButtonText = item?._id ? 'Update Parameter' : 'Create Parameter';

    return (
        <GenericFlexibleView
            elementType='Parameter'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as ParameterDefinition}
            itemType='parameters'
        >
            <Typography variant="h6" className={classes.titleText}>Type</Typography>
            <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                    value={item?.type || 'string'}
                    onChange={(e) => onChange({ type: e.target.value as ParameterTypes })}
                    disabled={!isEditMode}
                >
                    <MenuItem value={ParameterTypes.STRING}>String</MenuItem>
                    <MenuItem value={ParameterTypes.INTEGER}>Integer</MenuItem>
                    <MenuItem value={ParameterTypes.BOOLEAN}>Boolean</MenuItem>
                    <MenuItem value={ParameterTypes.OBJECT}>Object</MenuItem>
                </Select>
            </FormControl>
            <Typography variant="h6" className={classes.titleText}>Description</Typography>
            <TextField
                fullWidth
                label="Description"
                value={item?.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>Default Value</Typography>
            <TextField
                fullWidth
                label="Default Value"
                value={item?.default || ''}
                onChange={(e) => onChange({ default: item?.type === 'integer' ? Number(e.target.value) : e.target.value })}
                type={item?.type === 'integer' ? 'integer' : 'text'}
                margin="normal"
                disabled={!isEditMode}
            />
        </GenericFlexibleView>
    );
};

export default ParameterFlexibleView;