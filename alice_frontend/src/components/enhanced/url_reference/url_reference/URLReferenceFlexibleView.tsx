import React, { useCallback, useEffect } from 'react';
import {
    Typography,
    TextField,
    Box,
    Chip
} from '@mui/material';
import { getDefaultURLReferenceForm, URLReference, URLReferenceComponentProps } from '../../../../types/URLReferenceTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import useStyles from '../URLReferenceStyles';

const URLReferenceFlexibleView: React.FC<URLReferenceComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();
    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultURLReferenceForm());
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
            item={item as URLReference}
            itemType="urlreferences"
        >
            <Typography variant="h6" className={classes.titleText}>Title</Typography>
            <TextField
                fullWidth
                label="Title"
                value={item?.title || ''}
                onChange={(e) => onChange({ title: e.target.value })}
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

export default URLReferenceFlexibleView;