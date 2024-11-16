import React, { useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent, Paper } from '@mui/material';
import { Api } from '@mui/icons-material';
import useStyles from '../../../styles/UserSettingsStyles';
import { useCardDialog } from '../../../contexts/CardDialogContext';
import EnhancedAPIConfig from '../../../components/enhanced/api_config/api_config/EnhancedAPIConfig';
import { APIConfig } from '../../../types/ApiConfigTypes';
import Logger from '../../../utils/Logger';

const ApiConfigurations: React.FC = () => {
    const classes = useStyles();
    const { selectFlexibleItem } = useCardDialog();

    const handleApiSelect = useCallback((item: Partial<APIConfig>) => {
        Logger.debug('APIConfig selected:', item);
        selectFlexibleItem('APIConfig', 'edit', item._id, item as APIConfig);
    }, [selectFlexibleItem]);

    return (
        <Card className={classes.card}>
            <CardContent>
                <Box className={classes.apiConfigHeader}>
                    <Box>
                        <Api />
                        <Typography variant="h5">API Configs</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => selectFlexibleItem('APIConfig', 'create')}
                    >
                        Create New API Config
                    </Button>
                </Box>
                <Paper className={classes.apiPaper}>
                    <EnhancedAPIConfig
                        key={0}
                        mode="list"
                        fetchAll={true}
                        onView={handleApiSelect}
                    />
                </Paper>
            </CardContent>
        </Card>
    );
};

export default ApiConfigurations;