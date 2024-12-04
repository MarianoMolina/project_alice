import React, { useCallback, useEffect, useState } from 'react';
import { ParameterComponentProps, ParameterDefinition, ParameterTypes, getDefaultParameterForm } from '../../../../types/ParameterTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { SelectInput } from '../../common/inputs/SelectInput';
import { TextInput } from '../../common/inputs/TextInput';

const ParameterFlexibleView: React.FC<ParameterComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<ParameterDefinition>>(() => item || getDefaultParameterForm());
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Parameter' : mode === 'edit' ? 'Edit Parameter' : 'Parameter Details';
    const saveButtonText = item?._id ? 'Update Parameter' : 'Create Parameter';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultParameterForm());
        } else {
            setForm(item);
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof ParameterDefinition, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    return (
        <GenericFlexibleView
            elementType='Parameter'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as ParameterDefinition}
            itemType='parameters'
        >
            <SelectInput
                name="type"
                label="Parameter Type"
                value={form?.type || 'string'}
                onChange={(value) => handleFieldChange('type', value)}
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
                value={form?.description || ''}
                description='Enter a description for the parameter'
                onChange={(value) => onChange({ description: value })}
                disabled={!isEditMode}
            />
            <TextInput
                name="default"
                label="Default Value"
                description='Enter the default value for the parameter'
                value={form?.default || ''}
                onChange={(value) => handleFieldChange('default', value)}
                disabled={!isEditMode}
            />
        </GenericFlexibleView>
    );
};

export default ParameterFlexibleView;