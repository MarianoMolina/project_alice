import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, CircularProgress, Tooltip } from '@mui/material';
import { Storage, Refresh } from '@mui/icons-material';
import { useApi } from '../../../contexts/ApiContext';
import Logger from '../../../utils/Logger';
import { LMStudioModel } from '../../../services/api';
import { getFileSize } from '../../../utils/FileUtils';

const LMStudioStatus = () => {
    const { fetchLMStudioModels, unloadLMStudioModel } = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [unloadingModels, setUnloadingModels] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<LMStudioModel[]>([]);

    const checkStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const modelList = await fetchLMStudioModels();
            setModels(modelList);
            Logger.debug('LM Studio models fetched:', JSON.stringify(modelList));
        } catch (err) {
            Logger.error('Error fetching LM Studio status:', err);
            setError('Failed to connect to LM Studio');
            setModels([]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchLMStudioModels]);

    const handleUnloadModel = async (model: LMStudioModel) => {
        try {
            setUnloadingModels(prev => new Set(prev).add(model.id));
            await unloadLMStudioModel(model);
            await checkStatus(); // Refresh the list after unloading
        } catch (err) {
            Logger.error('Error unloading model:', err);
            setError(`Failed to unload model: ${model.id}`);
        } finally {
            setUnloadingModels(prev => {
                const newSet = new Set(prev);
                newSet.delete(model.id);
                return newSet;
            });
        }
    };

    // Initial fetch on mount only
    useEffect(() => {
        checkStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                                                        {model.id}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Type: {model.type}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Architecture: {model.architecture}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Size: {getFileSize(model.size).formatted}
                                                    </Typography>
                                                </div>
                                                <Tooltip title={model.is_loaded ? 'Unload Model' : undefined}>
                                                    <Button
                                                        onClick={() => model.is_loaded && handleUnloadModel(model)}
                                                        disabled={!model.is_loaded || unloadingModels.has(model.id)}
                                                        className="min-w-[100px]"
                                                    >
                                                        {unloadingModels.has(model.id) ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <Chip
                                                                label={model.is_loaded ? 'Loaded' : 'Not Loaded'}
                                                                color={model.is_loaded ? 'success' : 'default'}
                                                                size="small"
                                                                className="cursor-pointer"
                                                            />
                                                        )}
                                                    </Button>
                                                </Tooltip>
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