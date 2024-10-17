import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Typography
} from '@mui/material';
import { MessageComponentProps, MessageType, getDefaultMessageForm } from '../../../../types/MessageTypes';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import URLReferenceShortListView from '../../url_reference/url_reference/URLReferenceShortListView';
import FileShortListView from '../../file/file/FileShortListView';
import TaskResponseShortListView from '../../task_response/task_response/TaskResponseShortListView';
import MessageShortListView from './MessageShortListView';
import { useApi } from '../../../../contexts/ApiContext';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import { FileReference } from '../../../../types/FileTypes';
import { TaskResponse } from '../../../../types/TaskResponseTypes';
import { URLReference } from '../../../../types/URLReferenceTypes';
import { CollectionName } from '../../../../types/CollectionTypes';
import { References } from '../../../../types/ReferenceTypes';
import useStyles from '../MessageStyles';

const MessageFlexibleView: React.FC<MessageComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const { fetchItem } = useApi();
    const [form, setForm] = useState<Partial<MessageType>>(item || getDefaultMessageForm());
    const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);
    
    useEffect(() => {
        if (item) {
            setForm(item);
        } else if (!item || Object.keys(item).length === 0)  {
            onChange(getDefaultMessageForm());
        }
    }, [item, onChange]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setForm(prevForm => ({ ...prevForm, [name]: value }));
    }, []);

    const handleReferencesChange = useCallback(async (type: CollectionName, selectedIds: string[]) => {
        const fetchedItems = await Promise.all(selectedIds.map(id => fetchItem(type, id)));
        setForm(prevForm => {
            let updatedReferences: References = { ...prevForm.references };
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
                    updatedReferences.url_references = fetchedItems as URLReference[];
                    break;
            }
            return { ...prevForm, references: updatedReferences };
        });
    }, [fetchItem]);

    const handleAccordionToggle = useCallback((accordion: string | null) => {
        setActiveAccordion(prevAccordion => prevAccordion === accordion ? null : accordion);
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

    const title = mode === 'create' ? 'Create New Message' : mode === 'edit' ? 'Edit Message' : 'Message Details';
    const saveButtonText = form._id ? 'Update Message' : 'Create Message';

    const memoizedMessageSelect = useMemo(() => (
        <EnhancedSelect<MessageType>
            componentType="messages"
            EnhancedView={MessageShortListView}
            selectedItems={form.references?.messages || []}
            onSelect={(ids) => handleReferencesChange('messages', ids)}
            isInteractable={isEditMode}
            multiple
            label="Referenced Messages"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="referenced-messages"
        />
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.references?.messages, handleReferencesChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedFileSelect = useMemo(() => (
        <EnhancedSelect<FileReference>
            componentType="files"
            EnhancedView={FileShortListView}
            selectedItems={form.references?.files as FileReference[] || []}
            onSelect={(ids) => handleReferencesChange('files', ids)}
            isInteractable={isEditMode}
            multiple
            label="File References"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="file-references"
        />
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.references?.files, handleReferencesChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedTaskResponseSelect = useMemo(() => (
        <EnhancedSelect<TaskResponse>
            componentType="taskresults"
            EnhancedView={TaskResponseShortListView}
            selectedItems={form.references?.task_responses || []}
            onSelect={(ids) => handleReferencesChange('taskresults', ids)}
            isInteractable={isEditMode}
            multiple
            label="Task Responses"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="task-responses"
        />
    // eslint-disable-next-line react-hooks/exhaustive-deps 
    ), [form.references?.task_responses, handleReferencesChange, isEditMode, activeAccordion, handleAccordionToggle]);

    const memoizedURLReferenceSelect = useMemo(() => (
        <EnhancedSelect<URLReference>
            componentType="urlreferences"
            EnhancedView={URLReferenceShortListView}
            selectedItems={form.references?.url_references || []}
            onSelect={(ids) => handleReferencesChange('urlreferences', ids)}
            isInteractable={isEditMode}
            multiple
            label="Search Results"
            activeAccordion={activeAccordion}
            onAccordionToggle={handleAccordionToggle}
            accordionEntityName="search-results"
        />
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [form.references?.url_references, handleReferencesChange, isEditMode, activeAccordion, handleAccordionToggle]);

    return (
        <GenericFlexibleView
            elementType='Message'
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as MessageType}
            itemType='messages'
        >
            <Typography variant="h6" className={classes.titleText}>Role</Typography>
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

            <Typography variant="h6" className={classes.titleText}>Content</Typography>
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

            <Typography variant="h6" className={classes.titleText}>Generated By</Typography>
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
            <Typography variant="h6" className={classes.titleText}>References</Typography>
            {memoizedMessageSelect}
            {memoizedFileSelect}
            {memoizedTaskResponseSelect}
            {memoizedURLReferenceSelect}
        </GenericFlexibleView>
    );
};

export default MessageFlexibleView;