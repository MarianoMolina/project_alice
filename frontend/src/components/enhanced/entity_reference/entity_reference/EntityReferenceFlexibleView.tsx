import React, { useCallback, useEffect } from 'react';
import {
    Typography,
    TextField,
    Box,
    Chip
} from '@mui/material';
import { getDefaultEntityReferenceForm, EntityReference, EntityReferenceComponentProps } from '../../../../types/EntityReferenceTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../EntityReferenceStyles';

const EntityReferenceFlexibleView: React.FC<EntityReferenceComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();
    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultEntityReferenceForm());
        }
    }, [item, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New URL Reference' : mode === 'edit' ? 'Edit URL Reference' : 'URL Reference Details';
    const saveButtonText = item?._id ? 'Update URL Reference' : 'Create URL Reference';

    return (
        <GenericFlexibleView
            elementType="URL Reference"
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as EntityReference}
            itemType="entityreferences"
        >
            <Typography variant="h6" className={classes.titleText}>Name</Typography>
            <TextField
                fullWidth
                label="Title"
                value={item?.name || ''}
                onChange={(e) => onChange({ name: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>URL</Typography>
            <TextField
                fullWidth
                label="URL"
                value={item?.url || ''}
                onChange={(e) => onChange({ url: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <Typography variant="h6" className={classes.titleText}>Content</Typography>
            <TextField
                fullWidth
                label="Content"
                value={item?.content || ''}
                onChange={(e) => onChange({ content: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                disabled={!isEditMode}
            />
            <Box>
                <Typography variant="h6" className={classes.titleText}>Metadata</Typography>
                {Object.entries(item?.metadata || {}).map(([key, value]) => (
                    <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        style={{ margin: '0 4px 4px 0' }}
                    />
                ))}
            </Box>
        </GenericFlexibleView>
    );
};

export default EntityReferenceFlexibleView;