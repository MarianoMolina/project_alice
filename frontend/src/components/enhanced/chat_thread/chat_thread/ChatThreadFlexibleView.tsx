import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Alert,
    Box,
} from '@mui/material';
import { getDefaultChatForm, CheckpointType } from '../../../../types/ChatTypes';
import { AliceAgent } from '../../../../types/AgentTypes';
import { PopulatedTask } from '../../../../types/TaskTypes';
import { UserCheckpoint } from '../../../../types/UserCheckpointTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../agent/agent/AgentShortListView';
import TaskShortListView from '../../task/task/TaskShortListView';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import UserCheckpointShortListView from '../../user_checkpoint/user_checkpoint/UserCheckpointShortListView';
import TitleBox from '../../common/inputs/TitleBox';
import { TextInput } from '../../common/inputs/TextInput';
import { useAuth } from '../../../../contexts/AuthContext';
import { useDialog } from '../../../../contexts/DialogContext';
import Logger from '../../../../utils/Logger';
import MessageListView from '../../message/message/MessageListView';
import { MessageType } from '../../../../types/MessageTypes';
import { useApi } from '../../../../contexts/ApiContext';
import ApiValidationManager from '../../api/ApiValidationManager';
import { ChatThreadComponentProps, PopulatedChatThread } from '../../../../types/ChatThreadTypes';

const ChatThreadFlexibleView: React.FC<ChatThreadComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { selectCardItem } = useDialog();
    const [form, setForm] = useState<Partial<PopulatedChatThread>>(item as PopulatedChatThread || getDefaultChatForm());
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details';
    const saveButtonText = form._id ? 'Update Chat' : 'Create Chat';

    Logger.debug('ChatFlexibleView', { item, mode });

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    const handleFieldChange = useCallback((field: keyof AliceAgent, value: any) => {
        setForm(prevForm => ({ ...prevForm, [field]: value }));
    }, []);

    const validateForm = useCallback(() => {
        setValidationError(null);
        return true;
    }, []);

    const handleLocalSave = useCallback(() => {
        if (validateForm()) {
            onChange(form);
            setIsSaving(true);
        }
    }, [form, onChange, validateForm]);

    const handleLocalDelete = useCallback(() => {
        Logger.debug('ChatFlexibleView handleLocalDelete', { item, handleDelete });
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    return (
        <GenericFlexibleView
            elementType='ChatThread'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as PopulatedChatThread}
            itemType='chatthreads'
        >
            {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {validationError}
                </Alert>
            )}
            <TextInput
                name="name"
                label="Thread Name"
                value={form.name}
                onChange={(value) => handleFieldChange('name', value)}
                disabled={!isEditMode}
                required
                description="The display name of the thread."
                fullWidth
            />
            {form.messages && form.messages.length > 0 && (
                <TitleBox title="Messages" >
                    <Box mt={2}>
                        {form.messages.map((message, index) => (
                            <MessageListView
                                key={`message-${index}${message}`}
                                item={message as MessageType}
                                mode={'view'}
                                onView={(message) => selectCardItem && selectCardItem('Message', message._id ?? '', message)}
                                handleSave={async () => { }}
                                items={null}
                                onChange={() => { }}
                            />
                        ))}
                    </Box>
                </TitleBox>
            )}
            {form._id && (
                <TitleBox title="API validation" >
                    <ApiValidationManager chatId={form._id} />
                </TitleBox>
            )}
        </GenericFlexibleView>
    );
};

export default ChatThreadFlexibleView;