import React, { useState, useEffect } from 'react';
import {
    TextField,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Box,
} from '@mui/material';
import { ChatComponentProps, AliceChat, getDefaultChatForm } from '../../../../types/ChatTypes';
import { MessageType } from '../../../../types/MessageTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedModel from '../../model/model/EnhancedModel';
import EnhancedAgent from '../../agent/agent/EnhancedAgent';
import EnhancedTask from '../../task/task/EnhancedTask';
import { AliceAgent } from '../../../../types/AgentTypes';
import { AliceTask } from '../../../../types/TaskTypes';
import { useApi } from '../../../../context/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import MessageListView from '../../common/message/MessageList';
import MessageDetail from '../../common/message/MessageDetail';

const ChatFlexibleView: React.FC<ChatComponentProps> = ({ 
    item,
    onChange,
    mode,
    handleSave
}) => {
    const { fetchItem, updateMessageInChat } = useApi();
    const [form, setForm] = useState<Partial<AliceChat>>(getDefaultChatForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
    const [messageDialogMode, setMessageDialogMode] = useState<'view' | 'edit' | null>(null);

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

    const handleViewDetails = (type: 'agent' | 'model' | 'task', itemId: string) => {
        let content;
        switch (type) {
            case 'agent':
                content = <EnhancedAgent mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'model':
                content = <EnhancedModel mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'task':
                content = <EnhancedTask mode="card" itemId={itemId} fetchAll={false} />;
                break;
        }
        setDialogContent(content);
        setDialogOpen(true);
    };

    const handleViewMessage = (message: MessageType) => {
        setSelectedMessage(message);
        setMessageDialogMode('view');
    };

    const handleEditMessage = (message: MessageType) => {
        setSelectedMessage(message);
        setMessageDialogMode('edit');
    };

    const handleCloseMessageDialog = () => {
        setSelectedMessage(null);
        setMessageDialogMode(null);
    };

    const handleUpdateMessage = async (updatedMessage: MessageType) => {
        if (form._id && updatedMessage._id) {
            try {
                const updated = await updateMessageInChat(form._id, updatedMessage);
                const updatedMessages = form.messages?.map(msg => 
                    msg._id === updated._id ? updated : msg
                ) || [];
                onChange({ ...form, messages: updatedMessages });
                handleCloseMessageDialog();
            } catch (error) {
                console.error('Error updating message:', error);
                // Handle error (e.g., show an error message to the user)
            }
        }
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
                onView={(id) => handleViewDetails("agent", id)}
                accordionEntityName="agent"
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
                onView={(id) => handleViewDetails("task", id)}
                accordionEntityName="functions"
            />
            <Box mt={2}>
                <MessageListView 
                    messages={form.messages || []}
                    onView={handleViewMessage}
                    onEdit={isEditMode ? handleEditMessage : undefined}
                />
            </Box>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                {dialogContent}
            </Dialog>
            <Dialog open={!!selectedMessage} onClose={handleCloseMessageDialog} maxWidth="md" fullWidth>
                {selectedMessage && (
                    <DialogContent>
                        <MessageDetail
                            message={selectedMessage}
                            chatId={form._id}
                            mode={messageDialogMode || 'view'}
                            onUpdate={handleUpdateMessage}
                            onClose={handleCloseMessageDialog}
                        />
                    </DialogContent>
                )}
                <DialogActions>
                    <Button onClick={handleCloseMessageDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </GenericFlexibleView>
    );
};

export default ChatFlexibleView;