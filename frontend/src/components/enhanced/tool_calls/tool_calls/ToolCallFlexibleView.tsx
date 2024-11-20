import React, { useCallback, useEffect, useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    FormControl,
    FormHelperText,
    Alert,
} from '@mui/material';
import { ToolCallComponentProps, ToolCall, getDefaultToolCallForm, ToolCallConfig } from '../../../../types/ToolCallTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import useStyles from '../ToolCallStyles';
import { CodeBlock } from '../../../ui/markdown/CodeBlock';

const ToolCallFlexibleView: React.FC<ToolCallComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const classes = useStyles();
    const [argumentsError, setArgumentsError] = useState<string>('');
    const isEditMode = mode === 'edit' || mode === 'create';

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

    const handleArgumentsChange = (value: string) => {
        try {
            // Handle both string and object arguments
            let parsedValue: Record<string, any> | string = value;
            
            // If it looks like JSON, try to parse it
            if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                parsedValue = JSON.parse(value);
            }

            // Create a complete function config to ensure type safety
            const functionConfig: ToolCallConfig = {
                name: item?.function?.name || '',
                arguments: parsedValue
            };

            onChange({
                function: functionConfig
            });
            setArgumentsError('');
        } catch (error) {
            setArgumentsError('Invalid JSON format');
        }
    };

    const handleNameChange = (newName: string) => {
        const functionConfig: ToolCallConfig = {
            name: newName,
            arguments: item?.function?.arguments || {}
        };

        onChange({
            function: functionConfig
        });
    };

    // Convert arguments to string for display
    const getArgumentsString = () => {
        const args = item?.function?.arguments;
        if (typeof args === 'string') {
            return args;
        }
        try {
            return JSON.stringify(args, null, 2);
        } catch (error) {
            return '';
        }
    };

    const title = mode === 'create' ? 'Create New Tool Call' : mode === 'edit' ? 'Edit Tool Call' : 'Tool Call Details';
    const saveButtonText = item?._id ? 'Update Tool Call' : 'Create Tool Call';

    return (
        <GenericFlexibleView
            elementType='Tool Call'
            title={title}
            onSave={handleSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as ToolCall}
            itemType='toolcalls'
        >
            <Box className={classes.section}>
                <Typography variant="h6" className={classes.titleText}>Type</Typography>
                <TextField
                    fullWidth
                    value={item?.type || 'function'}
                    disabled={true} // Type is always 'function'
                    margin="normal"
                />
            </Box>

            <Box className={classes.section}>
                <Typography variant="h6" className={classes.titleText}>Function Name</Typography>
                <TextField
                    fullWidth
                    value={item?.function?.name || ''}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={!isEditMode}
                    margin="normal"
                />
            </Box>

            <Box className={classes.section}>
                <Typography variant="h6" className={classes.titleText}>Arguments</Typography>
                {isEditMode ? (
                    <FormControl fullWidth error={!!argumentsError}>
                        <TextField
                            multiline
                            rows={8}
                            value={getArgumentsString()}
                            onChange={(e) => handleArgumentsChange(e.target.value)}
                            placeholder="Enter arguments as JSON or string"
                            margin="normal"
                            error={!!argumentsError}
                        />
                        {argumentsError && (
                            <FormHelperText>{argumentsError}</FormHelperText>
                        )}
                    </FormControl>
                ) : (
                    <CodeBlock
                        language="json"
                        code={getArgumentsString()}
                    />
                )}
            </Box>

            {isEditMode && (
                <Alert severity="info" className={classes.alert}>
                    Arguments can be either a JSON object or a simple string. 
                    If entering a JSON object, ensure it's properly formatted.
                </Alert>
            )}
        </GenericFlexibleView>
    );
};

export default ToolCallFlexibleView;