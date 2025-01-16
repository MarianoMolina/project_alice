import React from 'react';
import { Typography, Grid } from '@mui/material';
import { User } from '../../../types/UserTypes';

interface UserStatsProps {
    user: User;
}

export const UserStats: React.FC<UserStatsProps> = ({ user }) => {
    const formatDate = (date: Date | undefined | null): string => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString();
    };

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Actions Taken</Typography>
                <Typography>{user.stats?.actions_taken || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Login Attempts</Typography>
                <Typography>{user.stats?.log_in_attempts || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Login Successes</Typography>
                <Typography>{user.stats?.log_in_successes || 0}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Last Login Attempt</Typography>
                <Typography>{formatDate(user.stats?.last_log_in_attempt)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Last Successful Login</Typography>
                <Typography>{formatDate(user.stats?.last_log_in_success)}</Typography>
            </Grid>
        </Grid>
    );
};

export default UserStats;