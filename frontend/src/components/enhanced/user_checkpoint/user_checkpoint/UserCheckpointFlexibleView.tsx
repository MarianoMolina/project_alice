import React, { useState, useCallback, useEffect } from 'react';

import GenericFlexibleView from '../../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import { TextInput } from '../../../common/inputs/TextInput';
import { getDefaultUserCheckpointForm, UserCheckpoint, UserCheckpointComponentProps } from '../../../../types/UserCheckpointTypes';
import ExitCodeManager from '../../../common/exit_code_manager/ExitCodeManager';

const UserCheckpointFlexibleView: React.FC<UserCheckpointComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<UserCheckpoint>>(item || getDefaultUserCheckpointForm());
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New UserCheckpoint' : mode === 'edit' ? 'Edit UserCheckpoint' : 'UserCheckpoint Details';
    const saveButtonText = form._id ? 'Update UserCheckpoint' : 'Create UserCheckpoint';

    Logger.debug('UserCheckpointFlexibleView', 'form', form);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item) {
            setForm(item);
        } else {
            onChange(getDefaultUserCheckpointForm());
        }
    }, [item, onChange]);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const handleFieldChange = useCallback((field: keyof UserCheckpoint, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    return (
        <GenericFlexibleView
            elementType="UserCheckpoint"
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as UserCheckpoint}
            itemType="usercheckpoints"
        >
            <TextInput
                name="user_prompt"
                label="User Prompt"
                value={form.user_prompt || ''}
                onChange={(value) => onChange({ user_prompt: value })}
                disabled={!isEditMode}
                description='Enter the prompt for the user'
            />
            <ExitCodeManager
                title="User Options"
                exitCodes={form.options_obj || {}}
                onChange={(value) => handleFieldChange('options_obj', value)}
                isEditMode={isEditMode}
            />
            <ExitCodeManager
                title="Map Next Task"
                exitCodes={form.task_next_obj || {}}
                onChange={(newExitCodes) => setForm(prevForm => ({ ...prevForm, task_next_obj: newExitCodes }))}
                isEditMode={isEditMode}
            />
        </GenericFlexibleView>
    );
};

export default UserCheckpointFlexibleView;