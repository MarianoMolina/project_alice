import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Dialog } from '@mui/material';
import { useApi } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';
import { User } from '../utils/Types';
import { API, ApiType } from '../utils/ApiTypes';
import EnhancedAPI from '../components/api/api/EnhancedApi';

const UserSettings: React.FC = () => {
    const { fetchItem, updateItem, createItem } = useApi();
    const [userObject, setUserObject] = useState<User | null>(null);
    const { user } = useAuth();
    const [showCreateAPI, setShowCreateAPI] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                setUserObject(user as User);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        loadUser();
    }, [user]);

    const handleUserUpdate = async (updatedUser: Partial<User>) => {
        if (userObject && userObject._id) {
            try {
                const updated = await updateItem('users', userObject._id, updatedUser);
                setUserObject(updated as User);
            } catch (error) {
                console.error('Error updating user:', error);
            }
        }
    };

    const handleCreateAPI = async (api: Partial<API>) => {
        if (userObject && userObject._id) {
            try {
                await createItem('apis', api);
                setShowCreateAPI(false);
                // Refresh the user object to include the new API
                const updatedUser = await fetchItem('users', userObject._id);
                setUserObject(updatedUser as User);
            } catch (error) {
                console.error('Error creating new API:', error);
            }
        }
    };

    const handleAPIUpdate = async (updatedAPI: API) => {
        if (userObject && userObject._id) {
            try {
                await updateItem('apis', updatedAPI._id!, updatedAPI);
                // Refresh the user object to reflect the updated API
                const updatedUser = await fetchItem('users', userObject._id);
                setUserObject(updatedUser as User);
            } catch (error) {
                console.error('Error updating API:', error);
            }
        }
    };

    if (!user) {
        return <Typography>Loading user settings...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4">User Settings</Typography>
            <TextField
                label="Name"
                value={userObject?.name}
                onChange={(e) => handleUserUpdate({ name: e.target.value })}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Email"
                value={user.email}
                onChange={(e) => handleUserUpdate({ email: e.target.value })}
                fullWidth
                margin="normal"
            />
            <Typography variant="h4">API configuration</Typography>
            <EnhancedAPI
                mode="fullList"
                fetchAll={true}
                onSave={handleAPIUpdate}
            />
            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowCreateAPI(true)}
                style={{ marginBottom: '1rem' }}
            >
                Create New API
            </Button>
            <Dialog open={showCreateAPI} onClose={() => setShowCreateAPI(false)}>
                <EnhancedAPI
                    mode="create"
                    fetchAll={true}
                    onSave={handleCreateAPI}
                />
            </Dialog>
        </Box>
    );
};

export default UserSettings;