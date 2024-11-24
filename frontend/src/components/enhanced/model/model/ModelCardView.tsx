import React from 'react';
import {
    Typography,
    Chip,
    Box,
} from '@mui/material';
import { Category, Memory, FormatShapes, Speed, Thermostat, Cached, Info, QueryBuilder } from '@mui/icons-material';
import { ModelComponentProps } from '../../../../types/ModelTypes';
import useStyles from '../ModelStyles';
import CommonCardView from '../../common/enhanced_component/CardView';

const ModelCardView: React.FC<ModelComponentProps> = ({ item }) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No model data available.</Typography>;
    }

    const listItems = [
        { icon: <Info />, primary_text: "Model Name", secondary_text: item.model_name || 'N/A' },
        { icon: <Speed />, primary_text: "API Name", secondary_text: item.api_name },
        { icon: <Category />, primary_text: "Model Type", secondary_text: item.model_type },
        { icon: <FormatShapes />, primary_text: "Model Format", secondary_text: item.model_format || 'N/A' },
        { icon: <Memory />, primary_text: "Context Size", secondary_text: item.ctx_size ? `${item.ctx_size} tokens` : 'N/A' },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        },
    ];

    return (
        <CommonCardView
            elementType='Model'
            title={item.short_name}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='models'
        >
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
        </CommonCardView>
    );
};

export default ModelCardView;