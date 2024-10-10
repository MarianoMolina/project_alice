import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    TextField,
    Box,
    Typography,
} from '@mui/material';
import { ChatComponentProps, AliceChat, getDefaultChatForm } from '../../../../types/ChatTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import AgentShortListView from '../../agent/agent/AgentShortListView';
import TaskShortListView from '../../task/task/TaskShortListView';
import { AliceAgent } from '../../../../types/AgentTypes';
import { AliceTask } from '../../../../types/TaskTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import MessageListView from '../../message/message/MessageListView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import Logger from '../../../../utils/Logger';
import useStyles from '../ChatStyles';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete,
}) => {
    const { fetchItem } = useApi();
    const { selectCardItem } = useCardDialog();
    const [form, setForm] = useState<Partial<AliceChat>>(item || getDefaultChatForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();

    const isEditMode = mode === 'edit' || mode === 'create';

    Logger.debug('ChatFlexibleView', { item, handleDelete });

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
            onChange(getDefaultChatForm());
        }
    }, [item, onChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleAgentChange = useCallback(async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            setForm(prevForm => ({ ...prevForm, alice_agent: agent }));
        } else {
            setForm(prevForm => ({ ...prevForm, alice_agent: undefined }));
        }
    }, [fetchItem]);

    const handleFunctionsChange = useCallback(async (selectedIds: string[]) => {
        const functions = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        setForm(prevForm => ({ ...prevForm, functions }));
    }, [fetchItem]);

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    }, []);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        Logger.debug('ChatFlexibleView handleLocalDelete', { item, handleDelete });
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const title = mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details';
    const saveButtonText = form._id ? 'Update Chat' : 'Create Chat';

    const memoizedAgentSelect = useMemo(() => (
        <EnhancedSelect<AliceAgent>
            componentType="agents"
            EnhancedView={AgentShortListView}
            selectedItems={form.alice_agent ? [form.alice_agent] : []}
            onSelect={handleAgentChange}
            isInteractable={isEditMode}
            label="Select Agent"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="agent"
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.alice_agent, handleAgentChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedTaskSelect = useMemo(() => (
        <EnhancedSelect<AliceTask>
            componentType="tasks"
            EnhancedView={TaskShortListView}
            selectedItems={form.functions || []}
            onSelect={handleFunctionsChange}
            isInteractable={isEditMode}
            multiple
            label="Select Functions"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="functions"
            showCreateButton={true}
        />
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.functions, handleFunctionsChange, isEditMode, activeAccordion, handleAccordionToggle]);

    return (
        <GenericFlexibleView
            elementType='Chat'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as AliceChat}
            itemType='chats'
        >
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <TextField
                fullWidth
                name="name"
                label="Chat Name"
                value={form.name || ''}
                onChange={handleInputChange}
                disabled={!isEditMode}
                margin="normal"
            />
            <Typography variant="h6" className={classes.titleText}>Agent</Typography>
            {memoizedAgentSelect}
            <Typography variant="h6" className={classes.titleText}>Tools for the Agent</Typography>
            {memoizedTaskSelect}
            {form.messages && form.messages.length > 0 && (
                <>
                    <Typography variant="h6" className={classes.titleText}>Messages</Typography>
                    <Box mt={2}>
                        <MessageListView
                            items={form.messages || []}
                            item={null}
                            onChange={() => { }}
                            mode={'view'}
                            handleSave={async () => { }}
                            onView={(message) => selectCardItem && selectCardItem('Message', message._id ?? '', message)}
                        />
                    </Box>
                </>
            )}
        </GenericFlexibleView>
    );
};

export default ChatFlexibleView;