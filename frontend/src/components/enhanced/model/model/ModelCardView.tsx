import React from 'react';
import {
    Typography,
    Chip,
    Box,
} from '@mui/material';
import { Category, Memory, FormatShapes, Thermostat, Cached, Info, QueryBuilder, Api } from '@mui/icons-material';
import { ModelComponentProps } from '../../../../types/ModelTypes';
import useStyles from '../ModelStyles';
import CommonCardView from '../../common/enhanced_component/CardView';
import { apiNameIcons, modelTypeIcons } from '../../../../utils/ApiUtils';
import { formatCamelCaseString } from '../../../../utils/StyleUtils';

const ModelCardView: React.FC<ModelComponentProps> = ({ item }) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No model data available.</Typography>;
    }

    const listItems = [
        { icon: <Info />, primary_text: "Model Name", secondary_text: item.model_name || 'N/A' },
        { icon: apiNameIcons[item.api_name] || <Api />, primary_text: "API Name", secondary_text: formatCamelCaseString(item.api_name) },
        { icon: modelTypeIcons[item.model_type] || <Category/>, primary_text: "Model Type", secondary_text: formatCamelCaseString(item.model_type) },
        { icon: <Memory />, primary_text: "Context Size", secondary_text: item.config_obj.ctx_size ? `${item.config_obj.ctx_size} tokens` : 'N/A' },
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
                    label={`Temperature: ${item.config_obj.temperature?.toFixed(2) || 'N/A'}`}
                    className={classes.chip}
                />
                <Chip
                    icon={<Cached />}
                    label={`Use Cache: ${item.config_obj.use_cache ? 'Yes' : 'No'}`}
                    className={classes.chip}
                />
                {item.config_obj.seed !== undefined && item.config_obj.seed !== null && (
                    <Chip
                        label={`Seed: ${item.config_obj.seed}`}
                        className={classes.chip}
                    />
                )}
            </Box>
        </CommonCardView>
    );
};

export default ModelCardView;