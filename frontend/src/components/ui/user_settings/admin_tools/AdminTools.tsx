import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Divider,
    Typography,
    CircularProgress,
    TextField,
    Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { UserListView } from './UserListView';
import { ApiName } from '../../../../types/ApiTypes';
import { ApiConfigType, initializeApiConfigMap } from '../../../../utils/ApiUtils';
import AdminApiConfigForm from './ApiConfigForm';
import { useApi } from '../../../../contexts/ApiContext';
import { User } from '../../../../types/UserTypes';
import { useNotification } from '../../../../contexts/NotificationContext';
import Logger from '../../../../utils/Logger';

export const AdminTools: React.FC = () => {
    const { addNotification } = useNotification();
    const { fetchItem, applyApiConfigToUser, updateAdminApiKeyMap, getAdminApiConfigMap } = useApi();
    
    // State for API configuration
    const [apiConfig, setApiConfig] = useState<ApiConfigType>(initializeApiConfigMap());
    const [users, setUsers] = useState<User[]>([]);
    const [enabledApis, setEnabledApis] = useState<Set<ApiName>>(
        new Set(Object.keys(apiConfig) as ApiName[])
    );
    
    // State for loading indicators
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    
    // State for map selection
    const [currentMapName, setCurrentMapName] = useState('upgrade_admin_api_key_map');
    const [newMapName, setNewMapName] = useState('');
    const [isCreatingNewMap, setIsCreatingNewMap] = useState(false);

    // Load data based on selected map
    const loadData = useCallback(async (mapName: string) => {
        setUpdateLoading(true);
        Logger.debug('Starting data load for map:', mapName);
        
        try {
            const [usersData, config] = await Promise.all([
                fetchItem('users') as Promise<User[]>,
                getAdminApiConfigMap(mapName)
            ]);
            
            Logger.debug('Users loaded:', usersData);
            Logger.debug('Config loaded:', config);
            
            setUsers(usersData);
            
            if (config) {
                Logger.debug('Setting config state:', config);
                setApiConfig(config);
                const newEnabledApis = new Set(Object.keys(config) as ApiName[]);
                Logger.debug('Setting enabled APIs:', Array.from(newEnabledApis));
                setEnabledApis(newEnabledApis);
            }
        } catch (error) {
            Logger.error('Load error:', error);
            addNotification('Failed to load data', 'error');
        } finally {
            setUpdateLoading(false);
            Logger.debug('Loading complete');
        }
    }, [fetchItem, addNotification, getAdminApiConfigMap]);

    useEffect(() => {
        loadData(currentMapName);
    }, [loadData, currentMapName]);

    // Handle API config changes and save
    const handleSaveConfig = useCallback(async (newConfig: ApiConfigType, newEnabledApis: Set<ApiName>) => {
        setLoading(true);
        try {
            await updateAdminApiKeyMap(newConfig, currentMapName);
            setApiConfig(newConfig);
            setEnabledApis(newEnabledApis);
            addNotification('API configuration saved successfully', 'success');
        } catch (error) {
            addNotification('Failed to save API configuration', 'error');
        } finally {
            setLoading(false);
        }
    }, [updateAdminApiKeyMap, addNotification, currentMapName]);

    // Handle user API updates
    const handleUpdateUserApis = useCallback(async (userId: string) => {
        setUpdateLoading(true);
        try {
            const enabledApisArray = Array.from(enabledApis);
            await applyApiConfigToUser(userId, enabledApisArray, currentMapName);
            addNotification('User APIs updated successfully', 'success');
        } catch (error) {
            addNotification('Failed to update user APIs', 'error');
        } finally {
            setUpdateLoading(false);
        }
    }, [applyApiConfigToUser, addNotification, enabledApis, currentMapName]);

    // Handle creating new map
    const handleCreateNewMap = async () => {
        if (!newMapName.trim()) {
            addNotification('Please enter a map name', 'error');
            return;
        }

        try {
            // Initialize new map with default config
            await updateAdminApiKeyMap(initializeApiConfigMap(), newMapName);
            setCurrentMapName(newMapName);
            setIsCreatingNewMap(false);
            setNewMapName('');
            addNotification('New API key map created successfully', 'success');
        } catch (error) {
            addNotification('Failed to create new API key map', 'error');
        }
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Map Selection Section */}
                <Grid item xs={12}>
                    <Paper elevation={0} variant="outlined" sx={{ p: 2}}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <TextField
                                label="Current API Key Map"
                                value={currentMapName}
                                onChange={(e) => setCurrentMapName(e.target.value)}
                                sx={{ flexGrow: 1 }}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setIsCreatingNewMap(true)}
                            >
                                New Map
                            </Button>
                        </Box>

                        {isCreatingNewMap && (
                            <Box mt={2} display="flex" alignItems="center" gap={2}>
                                <TextField
                                    label="New Map Name"
                                    value={newMapName}
                                    onChange={(e) => setNewMapName(e.target.value)}
                                    fullWidth
                                    placeholder="Enter new map name"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleCreateNewMap}
                                    disabled={!newMapName.trim()}
                                >
                                    Create
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setIsCreatingNewMap(false);
                                        setNewMapName('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* API Configuration Section */}
                <Grid item xs={12} lg={8}>
                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                            p: 2,
                            height: '100%',
                            minHeight: '600px',
                            overflow: 'auto'
                        }}
                    >
                        <Box position="relative">
                            {loading && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bgcolor="rgba(255, 255, 255, 0.7)"
                                    zIndex={1}
                                >
                                    <CircularProgress />
                                </Box>
                            )}
                            <AdminApiConfigForm
                                initialConfig={apiConfig}
                                initialEnabledApis={enabledApis}
                                onSave={handleSaveConfig}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* User List Section */}
                <Grid item xs={12} lg={4}>
                    <Paper
                        elevation={0}
                        variant="outlined"
                        sx={{
                            p: 2,
                            height: '100%',
                            minHeight: '600px',
                            overflow: 'auto'
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Users
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box position="relative">
                            {updateLoading && (
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    bgcolor="rgba(255, 255, 255, 0.7)"
                                    zIndex={1}
                                >
                                    <CircularProgress />
                                </Box>
                            )}
                            {users.length === 0 ? (
                                <Typography color="textSecondary">No users found</Typography>
                            ) : (
                                <UserListView
                                    users={users}
                                    hasUnsavedChanges={loading}
                                    disabledApis={new Set(
                                        Object.keys(apiConfig)
                                            .filter(api => !enabledApis.has(api as ApiName))
                                            .map(api => api as ApiName)
                                    )}
                                    onUpdateUserApis={handleUpdateUserApis}
                                    isUpdating={updateLoading}
                                    canToggleEdit={true}
                                />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};