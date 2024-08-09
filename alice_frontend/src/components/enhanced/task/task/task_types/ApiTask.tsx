import React, { useCallback, useMemo } from 'react';
import {
    Box,
    TextField,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    SelectChangeEvent
} from '@mui/material';
import { TaskFormsProps } from '../../../../../types/TaskTypes';
import FunctionDefinitionBuilder from '../../../common/function_select/FunctionDefinitionBuilder';
import { FunctionParameters } from '../../../../../types/ParameterTypes';
import { ApiType } from '../../../../../types/ApiTypes';

const ApiTaskForm: React.FC<TaskFormsProps> = ({
    item,
    onChange,
    mode,
    apis
}) => {
    const isEditMode = mode === 'edit' || mode === 'create';

    const availableApiTypes = useMemo(() => {
        return apis ? Array.from(new Set(apis.map(api => api.api_type))) : [];
    }, [apis]);

    const handleInputVariablesChange = useCallback((newDefinition: FunctionParameters) => {
        onChange({ ...item, input_variables: newDefinition });
    }, [onChange, item]);

    if (!item) {
        return <Box>No task data available.</Box>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange({ ...item, [name]: value });
    };

    const handleRequiredApisChange = (event: SelectChangeEvent<ApiType[]>) => {
        const value = event.target.value as ApiType[];
        onChange({ ...item, required_apis: value });
    };
    

    return (
        <Box>
            <TextField
                fullWidth
                margin="normal"
                name="task_name"
                label="Task Name"
                value={item.task_name || ''}
                onChange={handleInputChange}
                required
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                margin="normal"
                name="task_description"
                label="Task Description"
                value={item.task_description || ''}
                onChange={handleInputChange}
                multiline
                rows={3}
                required
                disabled={!isEditMode}
            />
            <Box>
                <Typography gutterBottom>Input Variables</Typography>
                <FunctionDefinitionBuilder
                    initialParameters={item.input_variables || undefined}
                    onChange={handleInputVariablesChange}
                    isViewOnly={!isEditMode}
                />
            </Box>
            <FormControl fullWidth margin="normal">
                <InputLabel>Required API Types</InputLabel>
                <Select<ApiType[]>
                    multiple
                    value={item.required_apis || []}
                    onChange={handleRequiredApisChange}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} />
                            ))}
                        </Box>
                    )}
                    disabled={!isEditMode}
                >
                    {availableApiTypes.map((apiType) => (
                        <MenuItem key={apiType} value={apiType}>
                            {apiType}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default ApiTaskForm;