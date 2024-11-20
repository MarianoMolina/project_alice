import React, { useCallback, useEffect, useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    Chip,
    Select,
    MenuItem,
    IconButton,
    InputLabel,
    FormControl,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { getDefaultEntityReferenceForm, EntityReference, EntityReferenceComponentProps, ReferenceCategoryType, ImageReference } from '../../../../types/EntityReferenceTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../EntityReferenceStyles';
import { referenceCategoryToIcon } from '../../../../utils/EntityReferenceUtils';
import { apiTypeIcons } from '../../../../utils/ApiUtils';
import Logger from '../../../../utils/Logger';

const EntityReferenceFlexibleView: React.FC<EntityReferenceComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<EntityReference>>(item || getDefaultEntityReferenceForm());
    const [isSaving, setIsSaving] = useState(false);
    const classes = useStyles();
    const isEditMode = mode === 'edit' || mode === 'create';
    
    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            setForm(getDefaultEntityReferenceForm());
        } else {
            setForm(item);
        }
        Logger.debug('EntityReferenceFlexibleView', 'item', item);
        Logger.debug('EntityReferenceFlexibleView', getDefaultEntityReferenceForm());
    }, [item]);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);

    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const updateForm = useCallback((updates: Partial<EntityReference>) => {
        setForm(prev => ({ ...prev, ...updates }));
    }, []);

    const handleAddCategory = (category: ReferenceCategoryType) => {
        if (!form.categories?.includes(category)) {
            updateForm({ categories: [...(form.categories || []), category] });
        }
    };

    const handleRemoveCategory = (categoryToRemove: ReferenceCategoryType) => {
        updateForm({
            categories: form.categories?.filter(cat => cat !== categoryToRemove) || []
        });
    };

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

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);

    const title = mode === 'create' ? 'Create New Entity Reference' : mode === 'edit' ? 'Edit Entity Reference' : 'Entity Reference Details';
    const saveButtonText = form._id ? 'Update Entity Reference' : 'Create Entity Reference';

    return (
        <GenericFlexibleView
            elementType="Entity Reference"
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as EntityReference}
            itemType="entityreferences"
        >
            <TextField
                fullWidth
                label="Source ID"
                value={form.source_id || ''}
                onChange={(e) => updateForm({ source_id: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />

            {form.source && (
                <Box className={classes.sourceContainer}>
                    <Typography variant="h6">Source</Typography>
                    <Chip
                        icon={apiTypeIcons[form.source]}
                        label={form.source}
                        className={classes.sourceChip}
                    />
                </Box>
            )}

            <TextField
                fullWidth
                label="Name"
                value={form.name || ''}
                onChange={(e) => updateForm({ name: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />

            <TextField
                fullWidth
                label="Description"
                value={form.description || ''}
                onChange={(e) => updateForm({ description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
                disabled={!isEditMode}
            />

            <TextField
                fullWidth
                label="URL"
                value={form.url || ''}
                onChange={(e) => updateForm({ url: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />

            <TextField
                fullWidth
                label="Content"
                value={form.content || ''}
                onChange={(e) => updateForm({ content: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                disabled={!isEditMode}
            />

            <Box className={classes.sectionContainer}>
                <Typography variant="h6">Categories</Typography>
                <Box className={classes.chipContainer}>
                    {isEditMode && (
                        <FormControl className={classes.categorySelect}>
                            <InputLabel>Add Category</InputLabel>
                            <Select
                                value=""
                                onChange={(e) => handleAddCategory(e.target.value as ReferenceCategoryType)}
                            >
                                {Object.values(ReferenceCategoryType).map((category) => {
                                    const Icon = referenceCategoryToIcon[category];
                                    return (
                                        <MenuItem key={category} value={category}>
                                            <Icon className={classes.menuIcon} />
                                            {category}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    )}
                    {form.categories?.map((category) => {
                        const Icon = referenceCategoryToIcon[category];
                        return (
                            <Chip
                                key={category}
                                icon={<Icon />}
                                label={category}
                                onDelete={isEditMode ? () => handleRemoveCategory(category) : undefined}
                                className={classes.chip}
                            />
                        );
                    })}
                </Box>
            </Box>

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