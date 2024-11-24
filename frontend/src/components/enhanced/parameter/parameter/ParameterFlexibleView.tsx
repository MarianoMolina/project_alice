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
import { SelectInput } from '../../common/inputs/SelectInput';
import { TextInput } from '../../common/inputs/TextInput';

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
            <SelectInput
                name="type"
                label="Parameter Type"
                value={item?.type || 'string'}
                onChange={(e) => onChange({ type: e as ParameterTypes })}
                disabled={!isEditMode}
                description='Select the data type of parameter'
                options={[
                    { value: ParameterTypes.STRING, label: 'String' },
                    { value: ParameterTypes.INTEGER, label: 'Integer' },
                    { value: ParameterTypes.BOOLEAN, label: 'Boolean' },
                    { value: ParameterTypes.OBJECT, label: 'Object' },
                    { value: ParameterTypes.ARRAY, label: 'Array' },
                ]}
            />
            <TextInput
                name="description"
                label="Description"
                value={item?.description || ''}
                description='Enter a description for the parameter'
                onChange={(value) => onChange({ description: value })}
                disabled={!isEditMode}
            />
            <TextInput
                name="default"
                label="Default Value"
                description='Enter the default value for the parameter'
                value={item?.default || ''}
                onChange={(value) => onChange({ default: item?.type === 'integer' ? Number(value) : value })}
                disabled={!isEditMode}
            />
        </GenericFlexibleView>
    );
};

export default ParameterFlexibleView;