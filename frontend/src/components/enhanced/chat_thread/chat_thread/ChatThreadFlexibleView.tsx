import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Alert,
} from '@mui/material';
import { getDefaultChatForm } from '../../../../types/ChatTypes';
import { AliceAgent } from '../../../../types/AgentTypes';
import GenericFlexibleView from '../../../common/enhanced_component/FlexibleView';
import TitleBox from '../../../common/inputs/TitleBox';
import { TextInput } from '../../../common/inputs/TextInput';
import Logger from '../../../../utils/Logger';
import { PopulatedMessage } from '../../../../types/MessageTypes';
import { ChatThreadComponentProps, PopulatedChatThread } from '../../../../types/ChatThreadTypes';
import ManageReferenceList from '../../../common/referecence_list_manager/ManageReferenceList';
import { useApi } from '../../../../contexts/ApiContext';

const ChatThreadFlexibleView: React.FC<ChatThreadComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchPopulatedItem } = useApi();
    const [form, setForm] = useState<Partial<PopulatedChatThread>>(item as PopulatedChatThread || getDefaultChatForm());
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Thread' : mode === 'edit' ? 'Edit Thread' : 'Thread Details';
    const saveButtonText = form._id ? 'Update Thread' : 'Create Thread';

    Logger.debug('ChatThreadFlexibleView', { item, mode });

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
        Logger.debug('ChatThreadFlexibleView handleLocalDelete', { item, handleDelete });
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const handleMessageChange = useCallback(async (messageIds: string[]) => {
        try {
            // Get the current messages from the form
            const currentMessages = form.messages || [];

            // Create a map of current message IDs to their populated objects
            const currentMessageMap = new Map(
                currentMessages.map(message => [message._id, message])
            );

            // Initialize array for new message list
            const updatedMessages: PopulatedMessage[] = [];

            // Process each message ID
            for (const messageId of messageIds) {
                // If we already have the populated message, use it
                if (currentMessageMap.has(messageId)) {
                    updatedMessages.push(currentMessageMap.get(messageId)!);
                } else {
                    // Fetch the new message's populated data
                    try {
                        const populatedMessage = await fetchPopulatedItem('messages', messageId) as PopulatedMessage;
                        if (populatedMessage) {
                            updatedMessages.push(populatedMessage);
                        }
                    } catch (error) {
                        Logger.error('Error fetching message', { messageId, error });
                        // Continue with other messages even if one fails
                        continue;
                    }
                }
            }

            // Update the form with the new message list
            setForm(prevForm => ({
                ...prevForm,
                messages: updatedMessages
            }));

        } catch (error) {
            Logger.error('Error in handleMessageChange', { error });
        }
    }, [form.messages, fetchPopulatedItem]);

    const memoizedThreadSelect = useMemo(() => (
        <ManageReferenceList
            collectionType="messages"
            elementIds={form.messages?.map(thread => thread._id!) || []}
            onListChange={handleMessageChange}
            isEditable={true}
        />
    ), [form.messages, handleMessageChange]);

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
            <TitleBox title="Messages" >
                {memoizedThreadSelect}
            </TitleBox>
        </GenericFlexibleView>
    );
};

export default ChatThreadFlexibleView;