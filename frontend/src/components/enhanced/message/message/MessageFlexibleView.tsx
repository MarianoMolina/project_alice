import React, { useState, useCallback, useEffect } from 'react';
import { ContentType, MessageComponentProps, MessageGenerators, MessageType, RoleType, getDefaultMessageForm } from '../../../../types/MessageTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import DataClusterManager from '../../data_cluster/data_cluster_manager/DataClusterManager';
import { TextInput } from '../../common/inputs/TextInput';
import { SelectInput } from '../../common/inputs/SelectInput';

const MessageFlexibleView: React.FC<MessageComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<MessageType>>(item || getDefaultMessageForm());
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Message' : mode === 'edit' ? 'Edit Message' : 'Message Details';
    const saveButtonText = form._id ? 'Update Message' : 'Create Message';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (item) {
            setForm(item);
        } else if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultMessageForm());
        }
    }, [item, onChange]);

    const handleFieldChange = useCallback((field: keyof MessageType, value: any) => {
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
            elementType='Message'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={form as MessageType}
            itemType='messages'
        >
            <SelectInput
                name='role'
                label='Role'
                value={form.role}
                onChange={(value) => handleFieldChange('role', value)}
                options={[
                    { value: RoleType.USER, label: 'User' },
                    { value: RoleType.ASSISTANT, label: 'Assistant' },
                    { value: RoleType.SYSTEM, label: 'System' },
                    { value: RoleType.TOOL, label: 'Tool' }
                ]}
                disabled={!isEditMode}
                description='Role of the message creator'
                required
            />
            <TextInput
                name='content'
                label='Content'
                value={form.content || ''}
                onChange={(value) => handleFieldChange('content', value)}
                disabled={!isEditMode}
                description='Enter the content of the message'
                required
            />
            <SelectInput
                name='generated_by'
                label='Generated By'
                value={form.generated_by}
                onChange={(value) => handleFieldChange('generated_by', value)}
                options={[
                    { value: MessageGenerators.USER, label: 'User' },
                    { value: MessageGenerators.LLM, label: 'LLM' },
                    { value: MessageGenerators.TOOL, label: 'Tool' },
                    { value: MessageGenerators.SYSTEM, label: 'System' }
                ]}
                disabled={!isEditMode}
                description='Select the entity that generated the message'
                required
            />
            <TextInput
                name='assistant_name'
                label='Assistant Name'
                value={form.assistant_name || ''}
                onChange={(value) => handleFieldChange('assistant_name', value)}
                disabled={!isEditMode}
                description='Enter the name of the assistant that generated the message'
            />
            <TextInput
                name='step'
                label='Step'
                value={form.step || ''}
                onChange={(value) => handleFieldChange('step', value)}
                disabled={!isEditMode}
                description='Enter the name of the "step" that generated the message'
            />
            <SelectInput
                name='type'
                label='Content Type'
                value={form.type}
                onChange={(value) => handleFieldChange('type', value)}
                options={[
                    { value: ContentType.TEXT, label: 'Text' },
                    { value: ContentType.IMAGE, label: 'Image' },
                    { value: ContentType.VIDEO, label: 'Video' },
                    { value: ContentType.AUDIO, label: 'Audio' },
                    { value: ContentType.FILE, label: 'File' },
                    { value: ContentType.TASK_RESULT, label: 'Task Result' },
                    { value: ContentType.MULTIPLE, label: 'Multiple' },
                    { value: ContentType.ENTITY_REFERENCE, label: 'Entity Reference' }
                ]}
                disabled={!isEditMode}
                description='Select the type of content'
            />
            <DataClusterManager
                title='References'
                dataCluster={form.references}
                isEditable={true}
                onDataClusterChange={(dataCluster) => setForm(prevForm => ({ ...prevForm, data_cluster: dataCluster }))}
                flatten={false}
                showSelect={false}
                showCreate={false}
            />
        </GenericFlexibleView>
    );
};

export default MessageFlexibleView;