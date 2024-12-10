import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress } from '@mui/material';
import { Storage, Refresh } from '@mui/icons-material';
import { useApi } from '../../../contexts/ApiContext';
import Logger from '../../../utils/Logger';

const LMStudioStatus = () => {
    const { fetchLMStudioModels } = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<Array<{
        id: string;
        type: string;
        is_loaded: boolean;
    }>>([]);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const modelList = await fetchLMStudioModels();
            setModels(modelList);
            Logger.debug('LM Studio models fetched:', modelList);
        } catch (err) {
            Logger.error('Error fetching LM Studio status:', err);
            setError('Failed to connect to LM Studio');
            setModels([]);
        } finally {
            setIsLoading(false);
        }
    }, []); 

    // Initial fetch on mount only
    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <Card className="w-full">
            <CardContent>
                <Box className="flex items-center gap-2 mb-4">
                    <Storage />
                    <Typography variant="h5">LM Studio Status</Typography>
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
                        <Box className="flex items-center gap-2">
                            <Chip
                                label="Connected"
                                color="success"
                                variant="outlined"
                            />
                            <Typography>
                                {models.length} model{models.length !== 1 ? 's' : ''} available
                            </Typography>
                        </Box>

                        {models.length > 0 && (
                            <div className="space-y-2">
                                <Typography variant="subtitle1" className="font-medium">
                                    Available Models:
                                </Typography>
                                <div className="space-y-2">
                                    {models.map((model) => (
                                        <Card key={model.id} variant="outlined" className="p-3">
                                            <Box className="flex items-center justify-between">
                                                <div>
                                                    <Typography variant="subtitle2" className="font-medium">
                                                        {model.id.split('/').pop()}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Type: {model.type}
                                                    </Typography>
                                                </div>
                                                <Chip
                                                    label={model.is_loaded ? 'Loaded' : 'Not Loaded'}
                                                    color={model.is_loaded ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </Box>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LMStudioStatus;