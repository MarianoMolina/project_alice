import React from 'react';
import {
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
    Chip,
    Box,
} from '@mui/material';
import { Category, Memory, FormatShapes, Thermostat, Cached, Speed } from '@mui/icons-material';
import { ModelComponentProps } from '../../../../types/ModelTypes';
import useStyles from '../ModelStyles';

const ModelCardView: React.FC<ModelComponentProps> = ({ item }) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No model data available.</Typography>;
    }

    return (
        <Card className={classes.card}>
            <CardContent>
                <Typography variant="h5" className={classes.title}>{item.short_name}</Typography>
                <Typography variant="subtitle1">{item.model_name}</Typography>
                <Typography variant="caption" className={classes.modelId}>
                    Model ID: {item._id}
                </Typography>

                <List className={classes.list}>
                    <ListItem>
                        <ListItemIcon><Category /></ListItemIcon>
                        <ListItemText primary="Model Type" secondary={item.model_type} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><FormatShapes /></ListItemIcon>
                        <ListItemText primary="Model Format" secondary={item.model_format || 'N/A'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Memory /></ListItemIcon>
                        <ListItemText primary="Context Size" secondary={item.ctx_size ? `${item.ctx_size} tokens` : 'N/A'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Speed /></ListItemIcon>
                        <ListItemText primary="API Provider" secondary={item.api_name} />
                    </ListItem>
                </List>

                <Box className={classes.chipContainer}>
                    <Chip
                        icon={<Thermostat />}
                        label={`Temperature: ${item.temperature?.toFixed(2) || 'N/A'}`}
                        className={classes.chip}
                    />
                    <Chip
                        icon={<Cached />}
                        label={`Use Cache: ${item.use_cache ? 'Yes' : 'No'}`}
                        className={classes.chip}
                    />
                    {item.seed !== undefined && item.seed !== null && (
                        <Chip
                            label={`Seed: ${item.seed}`}
                            className={classes.chip}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ModelCardView;