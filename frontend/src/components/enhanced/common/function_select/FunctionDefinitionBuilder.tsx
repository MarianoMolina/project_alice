import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    Checkbox,
    TextField,
    FormControlLabel,
    Paper,
    Alert,
    Grid,
    IconButton,
    Tooltip,
    Button,
    FormControl,
    InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { ParameterDefinition, FunctionParameters } from '../../../../types/ParameterTypes';
import EnhancedParameter from '../../parameter/parameter/EnhancedParameter';
import { useApi } from '../../../../contexts/ApiContext';
import { useCardDialog } from '../../../../contexts/CardDialogContext';
import useStyles from './FunctionStyles';
import * as FunctionUtils from './FunctionUtils';
import Logger from '../../../../utils/Logger';
import theme from '../../../../Theme';

interface FunctionDefinitionBuilderProps {
    title?: string | undefined;
    initialParameters?: FunctionParameters;
    onChange?: (functionDefinition: FunctionParameters) => void;
    isViewOnly?: boolean;
}

const FunctionDefinitionBuilder: React.FC<FunctionDefinitionBuilderProps> = ({
    title = undefined,
    initialParameters,
    onChange,
    isViewOnly = false
}) => {
    const classes = useStyles();
    const { fetchItem } = useApi();
    const { selectFlexibleItem } = useCardDialog();
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [activeParameters, setActiveParameters] = useState<FunctionUtils.ActiveParameter[]>([]);
    const initializedRef = useRef(false);

    useEffect(() => {
        fetchItem('parameters').then((params: any) => {
            setParameters(params);
        });
    }, [fetchItem]);

    useEffect(() => {
        if (!initializedRef.current && parameters.length > 0) {
            const initialActive = FunctionUtils.initializeActiveParameters(parameters, initialParameters);
            setActiveParameters(initialActive);
            initializedRef.current = true;
        }
    }, [parameters, initialParameters]);

    const handleParameterToggle = useCallback((paramId: string) => {
        setActiveParameters(prevParams => {
            const newParams = prevParams.map(param =>
                param._id === paramId
                    ? { ...param, isActive: !param.isActive }
                    : param
            );
            return newParams;
        });
    }, []);

    const handleNameChange = useCallback((paramId: string, name: string) => {
        setActiveParameters(prevParams => {
            const newParams = prevParams.map(param =>
                param._id === paramId ? { ...param, name } : param
            );
            return newParams;
        });
    }, []);

    const handleRequiredToggle = useCallback((paramId: string) => {
        setActiveParameters(prevParams => {
            const newParams = prevParams.map(param =>
                param._id === paramId ? { ...param, isRequired: !param.isRequired } : param
            );
            return newParams;
        });
    }, []);

    const handleCreateParameter = useCallback(() => {
        selectFlexibleItem('Parameter', 'create');
    }, [selectFlexibleItem]);

    const previousFunctionDefinition = useRef<FunctionParameters | null>(null);

    const functionDefinition = useMemo(() => {
        return FunctionUtils.buildFunctionDefinition(activeParameters);
    }, [activeParameters]);

    useEffect(() => {
        if (initializedRef.current && onChange && !isViewOnly) {
            if (JSON.stringify(functionDefinition) !== JSON.stringify(previousFunctionDefinition.current)) {
                onChange(functionDefinition);
                previousFunctionDefinition.current = functionDefinition;
            } else {
                Logger.debug('Function definition unchanged, skipping onChange');
            }
        }
    }, [functionDefinition, onChange, isViewOnly]);

    const validationMessage = useMemo(() => {
        const message = FunctionUtils.validateParameters(activeParameters);
        return message;
    }, [activeParameters]);

    return (
        <FormControl fullWidth variant="outlined" sx={{ marginTop: 1, marginBottom: 1 }}>
            <InputLabel shrink sx={{ backgroundColor: theme.palette.primary.dark }}>{title}</InputLabel>
            <div className={`relative p-4 border border-gray-200/60 rounded-lg ${classes.container}`}>
                {!isViewOnly && (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleCreateParameter}
                        >
                            Create Parameter
                        </Button>
                    </Box>
                )}
                {!isViewOnly && validationMessage && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {validationMessage}
                    </Alert>
                )}
                <Grid container spacing={2}>
                    {!isViewOnly && (
                        <Grid item xs={6}>
                            <Typography variant="subtitle1" gutterBottom>All Parameters</Typography>
                            <Paper className={classes.parameterList}>
                                <EnhancedParameter
                                    mode="shortList"
                                    fetchAll={true}
                                    isInteractable={true}
                                    onInteraction={(param: ParameterDefinition) => {
                                        handleParameterToggle(param._id!);
                                    }}
                                />
                            </Paper>
                        </Grid>
                    )}
                    <Grid item xs={isViewOnly ? 12 : 6}>
                        <Typography variant="subtitle1" gutterBottom>Active Parameters</Typography>
                        <Paper className={classes.parameterList}>
                            {activeParameters.filter(param => param.isActive).length > 0 ? (
                                <List>
                                    {activeParameters.filter(param => param.isActive).map((param) => (
                                        <ListItem key={param._id}>
                                            <TextField
                                                label="Parameter Name"
                                                value={param.name}
                                                onChange={(e) => handleNameChange(param._id!, e.target.value)}
                                                error={param.name.trim() === ''}
                                                helperText={param.name.trim() === '' ? 'Name is required' : ''}
                                                fullWidth
                                                margin="normal"
                                                disabled={isViewOnly}
                                            />
                                            <Box>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={param.isRequired}
                                                            onChange={() => handleRequiredToggle(param._id!)}
                                                            disabled={isViewOnly}
                                                        />
                                                    }
                                                    label="Required"
                                                />
                                            </Box>
                                            {!isViewOnly && (
                                                <Tooltip title="Deactivate">
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="deactivate"
                                                        onClick={() => handleParameterToggle(param._id!)}
                                                    >
                                                        <CloseIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box p={2} display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <Typography variant="body1" color="text.secondary">
                                        None
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </FormControl>
    );
};

export default FunctionDefinitionBuilder;