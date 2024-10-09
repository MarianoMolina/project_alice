import React, { useCallback, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { ParameterComponentProps, ParameterDefinition, getDefaultParameterForm } from '../../../../types/ParameterTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';

const ParameterFlexibleView: React.FC<ParameterComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {

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
            <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                    value={item?.type || 'string'}
                    onChange={(e) => onChange({ type: e.target.value as 'string' | 'integer' })}
                    disabled={!isEditMode}
                >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="integer">Integer</MenuItem>
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="Description"
                value={item?.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
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