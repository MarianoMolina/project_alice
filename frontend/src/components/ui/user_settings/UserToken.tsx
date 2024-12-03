import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { Key } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { CodeBlock } from '../../../components/ui/markdown/CodeBlock';
import useStyles from '../../../styles/UserSettingsStyles';

const UserToken: React.FC = () => {
    const classes = useStyles();
    const { getToken } = useAuth();
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        setUserToken(token);
    }, [getToken]);

    return (
        <Card className={classes.card}>
            <CardContent>
                <Box className={classes.userInfoHeader}>
                    <Key />
                    <Typography variant="h5">User Token</Typography>
                </Box>
                <Typography variant="body1" paragraph>
                    This is your user token. Keep it secret and use it for API authentication.
                </Typography>
                {userToken ? (
                    <CodeBlock
                        language="JWT Token"
                        code={userToken}
                    />
                ) : (
                    <Typography variant="body2" color="error">
                        Token not available. Please try refreshing the page and logging in again.
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default UserToken;