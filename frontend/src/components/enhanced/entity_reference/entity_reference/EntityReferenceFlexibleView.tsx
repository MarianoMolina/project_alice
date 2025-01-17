import React, { useCallback, useEffect, useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    Chip,
    IconButton,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { getDefaultEntityReferenceForm, EntityReferenceComponentProps, ReferenceCategoryType, ImageReference, PopulatedEntityReference } from '../../../../types/EntityReferenceTypes';
import GenericFlexibleView from '../../../common/enhanced_component/FlexibleView';
import useStyles from '../EntityReferenceStyles';
import { referenceCategoryToIcon } from '../../../../utils/EntityReferenceUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import { TextInput } from '../../../common/inputs/TextInput';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';
import { ApiType } from '../../../../types/ApiTypes';
import { IconSelectInput } from '../../../common/inputs/IconSelectInput';

const EntityReferenceFlexibleView: React.FC<EntityReferenceComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<PopulatedEntityReference>>(item as PopulatedEntityReference || getDefaultEntityReferenceForm());
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New Entity Reference' : mode === 'edit' ? 'Edit Entity Reference' : 'Entity Reference Details';
    const saveButtonText = form._id ? 'Update Entity Reference' : 'Create Entity Reference';

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            setForm(getDefaultEntityReferenceForm());
        } else {
            setForm(item as PopulatedEntityReference);
        }
    }, [item]);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const updateForm = useCallback((updates: Partial<PopulatedEntityReference>) => {
        setForm(prev => ({ ...prev, ...updates }));
    }, []);

    const handleAddImage = () => {
        updateForm({
            images: [...(form.images || []), { url: '', alt: '', caption: '' }]
        });
    };

    const handleUpdateImage = (index: number, field: keyof ImageReference, value: string) => {
        const newImages = [...(form.images || [])];
        newImages[index] = { ...newImages[index], [field]: value };
        updateForm({ images: newImages });
    };

    const handleRemoveImage = (index: number) => {
        updateForm({
            images: form.images?.filter((_, i) => i !== index)
        });
    };

    const handleRemoveConnection = (entityId: string) => {
        updateForm({
            connections: form.connections?.filter(conn => conn.entity_id !== entityId) || []
        });
    };

    const sourceOptions = Object.values(ApiType).map((type) => ({
        value: type,
        label: formatCamelCaseString(type),
        icon: apiTypeIcons[type],
    }));

    const categoryOptions = Object.values(ReferenceCategoryType).map((category) => ({
        value: category,
        label: formatCamelCaseString(category),
        icon: referenceCategoryToIcon[category],  
    }));

    return (
        <GenericFlexibleView
            elementType="Entity Reference"
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as PopulatedEntityReference}
            itemType="entityreferences"
        >
            <TextInput
                name='source_id'
                label="Source ID"
                value={form.source_id || ''}
                onChange={(value) => updateForm({ source_id: value })}
                disabled={!isEditMode}
            />
            <IconSelectInput
                name="source"
                label="Source"
                title="Source"
                value={form.source || ''}
                onChange={(value) => updateForm({ source: value as ApiType })}
                options={sourceOptions}
                disabled={!isEditMode}
                chipDisplay={true}
                fullWidth
            />

            <IconSelectInput
                name="categories"
                label="Categories"
                title="Categories"
                value={form.categories || []}
                onChange={(value) => updateForm({ categories: value as ReferenceCategoryType[] })}
                options={categoryOptions}
                disabled={!isEditMode}
                multiple
                chipDisplay={true}
                fullWidth
            />
            <TextInput
                name='name'
                label="Name"
                value={form.name || ''}
                onChange={(value) => updateForm({ name: value })}
                disabled={!isEditMode}
            />
            <TextInput
                name='url'
                label="URL"
                value={form.url || ''}
                onChange={(value) => updateForm({ url: value })}
                disabled={!isEditMode}
            />
            <TextInput
                name='description'
                label="Description"
                value={form.description || ''}
                onChange={(value) => updateForm({ description: value })}
                disabled={!isEditMode}
                multiline
                rows={3}
            />
            <TextInput
                name='content'
                label="Content"
                value={form.content || ''}
                onChange={(value) => updateForm({ content: value })}
                disabled={!isEditMode}
                multiline
                rows={4}
            />
            <Box className={classes.sectionContainer}>
                <Typography variant="h6">Images</Typography>
                {form.images?.map((image, index) => (
                    <Box key={index} className={classes.imageContainer}>
                        <TextField
                            label="URL"
                            value={image.url}
                            onChange={(e) => handleUpdateImage(index, 'url', e.target.value)}
                            disabled={!isEditMode}
                            className={classes.imageField}
                        />
                        <TextField
                            label="Alt Text"
                            value={image.alt}
                            onChange={(e) => handleUpdateImage(index, 'alt', e.target.value)}
                            disabled={!isEditMode}
                            className={classes.imageField}
                        />
                        <TextField
                            label="Caption"
                            value={image.caption}
                            onChange={(e) => handleUpdateImage(index, 'caption', e.target.value)}
                            disabled={!isEditMode}
                            className={classes.imageField}
                        />
                        {isEditMode && (
                            <IconButton onClick={() => handleRemoveImage(index)}>
                                <Close />
                            </IconButton>
                        )}
                    </Box>
                ))}
                {isEditMode && (
                    <IconButton onClick={handleAddImage}>
                        <Add />
                    </IconButton>
                )}
            </Box>

            <Box className={classes.sectionContainer}>
                <Typography variant="h6">Connections</Typography>
                <Box className={classes.chipContainer}>
                    {form.connections?.map((connection) => (
                        <Chip
                            key={connection.entity_id}
                            label={`${connection.entity_id} (${connection.similarity_score})`}
                            onDelete={isEditMode ? () => handleRemoveConnection(connection.entity_id) : undefined}
                            className={classes.chip}
                        />
                    ))}
                </Box>
            </Box>

            <Box>
                <Typography variant="h6">Metadata</Typography>
                {Object.entries(form.metadata || {}).map(([key, value]) => (
                    <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        className={classes.chip}
                    />
                ))}
            </Box>
        </GenericFlexibleView>
    );
};

export default EntityReferenceFlexibleView;