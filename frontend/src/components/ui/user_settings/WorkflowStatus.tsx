import { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../../contexts/ApiContext';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress } from '@mui/material';
import { HealthAndSafety, Refresh } from '@mui/icons-material';
import Logger from '../../../utils/Logger';

const WorkflowHealthStatus = () => {
    const { checkWorkflowHealth, checkWorkflowUserHealth } = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [basicHealth, setBasicHealth] = useState<{ status: string; message: string } | null>(null);
    const [userHealth, setUserHealth] = useState<{
        status: string;
        message: string;
        api_health: string
    } | null>(null);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [basicStatus, userStatus] = await Promise.all([
                checkWorkflowHealth(),
                checkWorkflowUserHealth()
            ]);

            setBasicHealth(basicStatus);
            setUserHealth(userStatus);
            Logger.debug('Workflow health status fetched:', { basicStatus, userStatus });
        } catch (err) {
            Logger.error('Error fetching workflow health status:', err);
            setError('Failed to fetch workflow health status');
            setBasicHealth(null);
            setUserHealth(null);
        } finally {
            setIsLoading(false);
        }
    }, [checkWorkflowUserHealth, checkWorkflowHealth]);

    // Initial fetch on mount
    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <Card className="w-full">
            <CardContent>
                <Box className="flex items-center gap-2 mb-4">
                    <HealthAndSafety />
                    <Typography variant="h5">Workflow Health Status</Typography>
                    <Button
                        startIcon={<Refresh />}
                        onClick={checkStatus}
                        disabled={isLoading}
                        variant="outlined"
                        size="small"
                        className="ml-auto"
                    >
                        Refresh
                    </Button>
                </Box>

                {isLoading ? (
                    <Box className="flex justify-center p-4">
                        <CircularProgress size={24} />
                    </Box>
                ) : error ? (
                    <Typography color="error" className="p-4">
                        {error}
                    </Typography>
                ) : (
                    <div className="space-y-4">
                        {/* Basic Health Status */}
                        {basicHealth && (
                            <Box className="flex items-center gap-2">
                                <Chip
                                    label={basicHealth.status}
                                    color={basicHealth.status === "OK" ? "success" : "error"}
                                    variant="outlined"
                                />
                                <Typography>{basicHealth.message}</Typography>
                            </Box>
                        )}

                        {/* User Health Status */}
                        {userHealth && userHealth.api_health && (
                            <div className="space-y-2">
                                <Typography variant="subtitle1" className="font-medium">
                                    API Health Status:
                                </Typography>
                                <div className="space-y-2">
                                    {userHealth.api_health}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WorkflowHealthStatus;