import React from 'react';
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';
import { ParameterComponentProps } from '../../../utils/ParameterTypes';

const ParameterFlexibleView: React.FC<ParameterComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave
}) => {

    if (!item) {
        return <Typography>No Parameter data available.</Typography>;
    }
    const isEditMode = mode === 'edit' || mode === 'create';

    return (
        <Box>
            <FormControl fullWidth margin="normal">
                <InputLabel>Type</InputLabel>
                <Select
                    value={item?.type || 'string'}
                    onChange={(e) => onChange({ type: e.target.value as 'string' | 'number' })}
                    disabled={!isEditMode}
                >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="Description"
                value={item?.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                margin="normal"
                disabled={!isEditMode}
            />
            <TextField
                fullWidth
                label="Default Value"
                value={item?.default || ''}
                onChange={(e) => onChange({ default: item?.type === 'number' ? Number(e.target.value) : e.target.value })}
                type={item?.type === 'number' ? 'number' : 'text'}
                margin="normal"
                disabled={!isEditMode}
            />
            {isEditMode && (
                <Button variant="contained" color="primary" onClick={handleSave}>
                    {item?._id ? 'Update Parameter' : 'Create Parameter'}
                </Button>
            )}
        </Box>
    );
};

export default ParameterFlexibleView;