import React, { useState, useEffect } from 'react';
import {
    TextField,
    Box,
} from '@mui/material';
import { ChatComponentProps, AliceChat, getDefaultChatForm } from '../../../../types/ChatTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedAgent from '../../agent/agent/EnhancedAgent';
import EnhancedTask from '../../task/task/EnhancedTask';
import { AliceAgent } from '../../../../types/AgentTypes';
import { AliceTask } from '../../../../types/TaskTypes';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import MessageListView from '../../message/message/MessageListView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
}) => {
    const { fetchItem } = useApi();
    const { selectCardItem } = useCardDialog();
    const [form, setForm] = useState<Partial<AliceChat>>(getDefaultChatForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setForm({ ...getDefaultChatForm(), ...item });
        }
    }, [item]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange({ ...form, [name]: value });
    };

    const handleAgentChange = async (selectedIds: string[]) => {
        if (selectedIds.length > 0) {
            const agent = await fetchItem('agents', selectedIds[0]) as AliceAgent;
            onChange({ ...form, alice_agent: agent });
        } else {
            onChange({ ...form, alice_agent: undefined });
        }
    };

    const handleFunctionsChange = async (selectedIds: string[]) => {
        const functions = await Promise.all(selectedIds.map(id => fetchItem('tasks', id) as Promise<AliceTask>));
        onChange({ ...form, functions });
    };

    const handleAccordionToggle = (accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    };

    const title = mode === 'create' ? 'Create New Chat' : mode === 'edit' ? 'Edit Chat' : 'Chat Details';
    const saveButtonText = form._id ? 'Update Chat' : 'Create Chat';

    return (
        <GenericFlexibleView
            elementType='Chat'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <TextField
                fullWidth
                name="name"
                label="Chat Name"
                value={form.name || ''}
                onChange={handleInputChange}
                disabled={!isEditMode}
            />
            <EnhancedSelect<AliceAgent>
                componentType="agents"
                EnhancedComponent={EnhancedAgent}
                selectedItems={form.alice_agent ? [form.alice_agent] : []}
                onSelect={handleAgentChange}
                isInteractable={isEditMode}
                label="Select Agent"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                accordionEntityName="agent"
                showCreateButton={true}
            />
            <EnhancedSelect<AliceTask>
                componentType="tasks"
                EnhancedComponent={EnhancedTask}
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
        </GenericFlexibleView>
    );
};

export default ChatFlexibleView;