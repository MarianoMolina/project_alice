import React, { useState, useCallback, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Divider,
    Typography,
    CircularProgress,
} from '@mui/material';
import { UserListView } from './UserListView';
import { ApiName } from '../../../../types/ApiTypes';
import { ApiConfigType } from '../../../../utils/ApiUtils';
import { initializeApiConfigMap } from './AdminUtils';
import AdminApiConfigForm from './ApiConfigForm';
import { useApi } from '../../../../contexts/ApiContext';
import { User } from '../../../../types/UserTypes';
import { useNotification } from '../../../../contexts/NotificationContext';
import Logger from '../../../../utils/Logger';

export const AdminTools: React.FC = () => {
    const { addNotification } = useNotification();
    const { fetchItem, applyApiConfigToUser, updateAdminApiKeyMap, getAdminApiConfigMap } = useApi();
    const [apiConfig, setApiConfig] = useState<ApiConfigType>(initializeApiConfigMap());
    const [users, setUsers] = useState<User[]>([]);
    const [enabledApis, setEnabledApis] = useState<Set<ApiName>>(
        new Set(Object.keys(apiConfig) as ApiName[])
    );
    const [loading, setLoading] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setUpdateLoading(true);
            Logger.info('Starting data load...');
            
            try {
                const [usersData, config] = await Promise.all([
                    fetchItem('users') as Promise<User[]>,
                    getAdminApiConfigMap()
                ]);
                
                Logger.info('Users loaded:', usersData);
                Logger.info('Config loaded:', config);
                
                setUsers(usersData);
                
                if (config) {
                    Logger.info('Setting config state:', config);
                    setApiConfig(config);
                    const newEnabledApis = new Set(Object.keys(config) as ApiName[]);
                    Logger.info('Setting enabled APIs:', Array.from(newEnabledApis));
                    setEnabledApis(newEnabledApis);
                }
            } catch (error) {
                Logger.error('Load error:', error);
                addNotification('Failed to load data', 'error');
            } finally {
                setUpdateLoading(false);
                Logger.info('Loading complete');
            }
        };
    
        loadData();
    }, [fetchItem, addNotification, getAdminApiConfigMap]);

    // Handle API config changes and save
    const handleSaveConfig = useCallback(async (newConfig: ApiConfigType, newEnabledApis: Set<ApiName>) => {
        setLoading(true);
        try {
            await updateAdminApiKeyMap(newConfig);
            setApiConfig(newConfig);
            setEnabledApis(newEnabledApis);
            addNotification('API configuration saved successfully','success');
        } catch (error) {
            addNotification('Failed to save API configuration', 'error');
        } finally {
            setLoading(false);
        }
    }, [updateAdminApiKeyMap, addNotification]);

    // Handle user API updates
    const handleUpdateUserApis = useCallback(async (userId: string) => {
        setUpdateLoading(true);
        try {
            const enabledApisArray = Array.from(enabledApis);
            await applyApiConfigToUser(userId, enabledApisArray);
            addNotification('User APIs updated successfully', 'success');
        } catch (error) {
            addNotification('Failed to update user APIs', 'error');
        } finally {
            setUpdateLoading(false);
        }
    }, [applyApiConfigToUser, addNotification, enabledApis]);

    return (
        <Box>
            <Grid container spacing={3}>
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
                                />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminTools;