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
    InputLabel,
    useTheme,
    useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { ParameterDefinition, FunctionParameters } from '../../../types/ParameterTypes';
import EnhancedParameter from '../../enhanced/parameter/parameter/EnhancedParameter';
import { useApi } from '../../../contexts/ApiContext';
import { useDialog } from '../../../contexts/DialogContext';
import useStyles from './FunctionStyles';
import * as FunctionUtils from './FunctionUtils';
import Logger from '../../../utils/Logger';
import { Visibility } from '@mui/icons-material';

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
    const { selectFlexibleItem, selectCardItem } = useDialog();
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [activeParameters, setActiveParameters] = useState<FunctionUtils.ActiveParameter[]>([]);
    const initializedRef = useRef(false);

    // Add responsive breakpoint check
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // 'md' is typically 900px

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
            <div className={`relative p-4 border border-gray-200/60 rounded-lg ml-2 mr-2 ${classes.container}`}>
                {!isViewOnly && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                <Grid container spacing={2} direction={isSmallScreen ? 'column' : 'row'}>
                    {!isViewOnly && (
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle1" gutterBottom>All Parameters</Typography>
                            <Paper className={classes.parameterList}>
                                <EnhancedParameter
                                    mode="shortList"
                                    fetchAll={true}
                                    isInteractable={true}
                                    onInteraction={(param: ParameterDefinition) => {
                                        handleParameterToggle(param._id!);
                                    }}
                                    onView={(param: ParameterDefinition) => selectCardItem('Parameter', param._id!, param)}
                                />
                            </Paper>
                        </Grid>
                    )}
                    <Grid item xs={12} md={isViewOnly ? 12 : 6}>
                        <Typography variant="subtitle1" gutterBottom>Active Parameters</Typography>
                        <Paper className={classes.parameterList}>
                            {activeParameters.filter(param => param.isActive).length > 0 ? (
                                <List>
                                    {activeParameters.filter(param => param.isActive).map((param) => (
                                        <ListItem 
                                            key={param._id}
                                            sx={{
                                                flexDirection: isSmallScreen ? 'column' : 'row',
                                                alignItems: isSmallScreen ? 'stretch' : 'center',
                                                gap: isSmallScreen ? 1 : 0
                                            }}
                                        >
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
                                            <Box 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    justifyContent: isSmallScreen ? 'space-between' : 'flex-end',
                                                    width: isSmallScreen ? '100%' : 'auto',
                                                    mt: isSmallScreen ? 1 : 0
                                                }}
                                            >
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
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="view"
                                                        onClick={() => selectCardItem('Parameter', param._id!, param)}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
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
                                                </Box>
                                            </Box>
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