import React from 'react';
import {
    Typography,
    Grid,
    Chip,
    FormControl,
    Select,
    MenuItem,
    TextField,
    SelectChangeEvent
} from '@mui/material';
import { User, UserRole, UserTier, defaultUserStats } from '../../../types/UserTypes';
import { FIELD_CONFIG } from './UserDetail';

interface BasicInfoProps {
    editedUser: User;
    isEditing: boolean;
    isAdmin: boolean;
    onUserEdit: (updatedUser: User) => void;
}

export const BasicInfo: React.FC<BasicInfoProps> = ({
    editedUser,
    isEditing,
    isAdmin,
    onUserEdit
}) => {
    const handleRoleChange = (event: SelectChangeEvent<string>): void => {
        onUserEdit({
            ...editedUser,
            role: event.target.value as UserRole
        });
    };

    const handleTierChange = (event: SelectChangeEvent<string>): void => {
        const userStats = editedUser.stats || defaultUserStats();
        onUserEdit({
            ...editedUser,
            stats: {
                ...userStats,
                user_tier: event.target.value as UserTier
            }
        });
    };


    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                {isEditing ? (
                    <TextField
                        fullWidth
                        size="small"
                        value={editedUser.name}
                        onChange={(e) => onUserEdit({
                            ...editedUser,
                            name: e.target.value
                        })}
                        sx={{ mt: 1 }}
                    />
                ) : (
                    <Typography>{editedUser.name}</Typography>
                )}
            </Grid>

            {FIELD_CONFIG.basicInfo.email.viewAccess === 'all' && (
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                    <Typography>{editedUser.email}</Typography>
                </Grid>
            )}

            {FIELD_CONFIG.basicInfo.role.viewAccess === 'all' && (
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Role</Typography>
                    {isEditing && isAdmin ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                            <Select
                                value={editedUser.role}
                                onChange={handleRoleChange}
                            >
                                <MenuItem value={UserRole.USER}>User</MenuItem>
                                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                            </Select>
                        </FormControl>
                    ) : (
                        <Chip
                            label={editedUser.role}
                            size="small"
                            color={editedUser.role === UserRole.ADMIN ? 'primary' : 'default'}
                            sx={{ mt: 1 }}
                        />
                    )}
                </Grid>
            )}

            {FIELD_CONFIG.basicInfo.userTier.viewAccess === 'all' && (
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">User Tier</Typography>
                    {isEditing && isAdmin ? (
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                            <Select
                                value={editedUser.stats?.user_tier || editedUser.stats?.user_tier}
                                onChange={handleTierChange}
                            >
                                <MenuItem value={UserTier.FREE}>Free</MenuItem>
                                <MenuItem value={UserTier.PRO}>Pro</MenuItem>
                                <MenuItem value={UserTier.ENTERPRISE}>Enterprise</MenuItem>
                            </Select>
                        </FormControl>
                    ) : (
                        <Chip
                            label={editedUser.stats?.user_tier}
                            size="small"
                            color={editedUser.stats?.user_tier !== UserTier.FREE ? 'primary' : 'default'}
                            sx={{ mt: 1 }}
                        />
                    )}
                </Grid>
            )}
        </Grid>
    );
};

export default BasicInfo;