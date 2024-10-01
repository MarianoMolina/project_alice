import React, { useState, useEffect } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    SelectChangeEvent,
    Typography
} from '@mui/material';
import { MessageComponentProps, MessageType, getDefaultMessageForm } from '../../../../types/MessageTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import EnhancedFile from '../../file/file/EnhancedFile';
import EnhancedTaskResponse from '../../task_response/task_response/EnhancedTaskResponse';
import EnhancedMessage from '../message/EnhancedMessage';
import EnhancedURLReference from '../../url_reference/url_reference/EnhancedURLReference';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { FileReference } from '../../../../types/FileTypes';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import { CollectionName, CollectionElementString } from '../../../../types/CollectionTypes';
import { References } from '../../../../types/ReferenceTypes';

const MessageFlexibleView: React.FC<MessageComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<MessageType>>(getDefaultMessageForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogContent, setDialogContent] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (item) {
            setForm({ ...getDefaultMessageForm(), ...item });
        }
    }, [item]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange({ ...form, [name]: value });
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        onChange({ ...form, [name as string]: value });
    };

    const handleReferencesChange = async (type: CollectionName, selectedIds: string[]) => {
        const fetchedItems = await Promise.all(selectedIds.map(id => fetchItem(type, id)));
        let updatedReferences: References = { ...form.references };

        switch (type) {
            case 'messages':
                updatedReferences.messages = fetchedItems as MessageType[];
                break;
            case 'files':
                updatedReferences.files = fetchedItems as FileReference[];
                break;
            case 'taskresults':
                updatedReferences.task_responses = fetchedItems as TaskResponse[];
                break;
            case 'urlreferences':
                updatedReferences.search_results = fetchedItems as URLReference[];
                break;
        }

        onChange({ ...form, references: updatedReferences });
    };

    const handleAccordionToggle = (accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
    };

    const handleViewDetails = (type: CollectionElementString, itemId: string) => {
        let content;
        switch (type) {
            case 'File':
                content = <EnhancedFile mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'TaskResponse':
                content = <EnhancedTaskResponse mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'Message':
                content = <EnhancedMessage mode="card" itemId={itemId} fetchAll={false} />;
                break;
            case 'URLReference':
                content = <EnhancedURLReference mode="card" itemId={itemId} fetchAll={false} />;
                break;
        }
        setDialogContent(content);
        setDialogOpen(true);
    };

    const title = mode === 'create' ? 'Create New Message' : mode === 'edit' ? 'Edit Message' : 'Message Details';
    const saveButtonText = form._id ? 'Update Message' : 'Create Message';

    return (
        <GenericFlexibleView
            elementType='Message'
            title={title}
            onSave={handleSave}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
        >
            <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                    name="role"
                    value={form.role || ''}
                    onChange={handleSelectChange}
                    disabled={!isEditMode}
                >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="assistant">Assistant</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="tool">Tool</MenuItem>
                </Select>
            </FormControl>

            <TextField
                fullWidth
                multiline
                rows={4}
                name="content"
                label="Content"
                value={form.content || ''}
                onChange={handleInputChange}
                margin="normal"
                disabled={!isEditMode}
            />

            <FormControl fullWidth margin="normal">
                <InputLabel>Generated By</InputLabel>
                <Select
                    name="generated_by"
                    value={form.generated_by || ''}
                    onChange={handleSelectChange}
                    disabled={!isEditMode}
                >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="llm">LLM</MenuItem>
                    <MenuItem value="tool">Tool</MenuItem>
                </Select>
            </FormControl>

            <Typography variant="h6" gutterBottom>References</Typography>

            <EnhancedSelect<MessageType>
                componentType="messages"
                EnhancedComponent={EnhancedMessage}
                selectedItems={form.references?.messages || []}
                onSelect={(ids) => handleReferencesChange('messages', ids)}
                isInteractable={isEditMode}
                multiple
                label="Referenced Messages"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("Message", id)}
                accordionEntityName="referenced-messages"
            />

            <EnhancedSelect<FileReference>
                componentType="files"
                EnhancedComponent={EnhancedFile}
                selectedItems={form.references?.files as FileReference[] || []}
                onSelect={(ids) => handleReferencesChange('files', ids)}
                isInteractable={isEditMode}
                multiple
                label="File References"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("File", id)}
                accordionEntityName="file-references"
            />

            <EnhancedSelect<TaskResponse>
                componentType="taskresults"
                EnhancedComponent={EnhancedTaskResponse}
                selectedItems={form.references?.task_responses || []}
                onSelect={(ids) => handleReferencesChange('taskresults', ids)}
                isInteractable={isEditMode}
                multiple
                label="Task Responses"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("TaskResponse", id)}
                accordionEntityName="task-responses"
            />

            <EnhancedSelect<URLReference>
                componentType="urlreferences"
                EnhancedComponent={EnhancedURLReference}
                selectedItems={form.references?.search_results || []}
                onSelect={(ids) => handleReferencesChange('urlreferences', ids)}
                isInteractable={isEditMode}
                multiple
                label="Search Results"
                activeAccordion={activeAccordion}
                onAccordionToggle={handleAccordionToggle}
                onView={(id) => handleViewDetails("URLReference", id)}
                accordionEntityName="search-results"
            />

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                {dialogContent}
            </Dialog>
        </GenericFlexibleView>
    );
};

export default MessageFlexibleView;