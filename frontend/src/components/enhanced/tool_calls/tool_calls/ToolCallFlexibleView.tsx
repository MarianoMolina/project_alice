import React, { useCallback, useEffect } from 'react';
import {
    Typography,
} from '@mui/material';
import { ToolCallComponentProps, ToolCall, getDefaultToolCallForm } from '../../../../types/ToolCallTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../ToolCallStyles';

const ToolCallFlexibleView: React.FC<ToolCallComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();

    useEffect(() => {
        if (!item || Object.keys(item).length === 0) {
            onChange(getDefaultToolCallForm());
        }
        Logger.debug('ToolCallFlexibleView', 'item', item);
        Logger.debug('ToolCallFlexibleView', getDefaultToolCallForm());
    }, [item, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const isEditMode = mode === 'edit' || mode === 'create';

    const title = mode === 'create' ? 'Create New ToolCall' : mode === 'edit' ? 'Edit ToolCall' : 'ToolCall Details';
    const saveButtonText = item?._id ? 'Update ToolCall' : 'Create ToolCall';

    return (
        <GenericFlexibleView
            elementType='ToolCall'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as ToolCall}
            itemType='toolcalls'
        >
            <Typography variant="h6" className={classes.titleText}>Type</Typography>

        </GenericFlexibleView>
    );
};

export default ToolCallFlexibleView;