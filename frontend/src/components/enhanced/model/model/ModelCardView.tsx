import React from 'react';
import {
    Typography,
    Chip,
    Box
} from '@mui/material';
import { 
    Category, 
    Memory, 
    Thermostat, 
    Cached, 
    Info, 
    QueryBuilder, 
    Api,
    Message,
    AttachMoney,
    Settings
} from '@mui/icons-material';
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

    // Create chip containers for each section
    const renderModelConfigChips = () => (
        <Box className={classes.chipContainer}>
            <Chip
                icon={<Thermostat />}
                label={`Temperature: ${item.config_obj?.temperature?.toFixed(2) || 'N/A'}`}
                className={classes.chip}
            />
            <Chip
                icon={<Cached />}
                label={`Use Cache: ${item.config_obj?.use_cache ? 'Yes' : 'No'}`}
                className={classes.chip}
            />
            {item.config_obj?.seed !== undefined && item.config_obj?.seed !== null && (
                <Chip
                    icon={<Settings />}
                    label={`Seed: ${item.config_obj.seed}`}
                    className={classes.chip}
                />
            )}
            {item.config_obj?.max_tokens_gen && (
                <Chip
                    icon={<Settings />}
                    label={`Max Tokens: ${item.config_obj.max_tokens_gen}`}
                    className={classes.chip}
                />
            )}
        </Box>
    );

    const renderPromptConfigChips = () => (
        <Box className={classes.chipContainer}>
            <Chip
                icon={<Message />}
                label={`BOS: ${item.config_obj?.prompt_config?.bos || '<|im_start|>'}`}
                className={classes.chip}
            />
            <Chip
                icon={<Message />}
                label={`EOS: ${item.config_obj?.prompt_config?.eos || '<|im_end|>'}`}
                className={classes.chip}
            />
            <Chip
                label={`System: ${item.config_obj?.prompt_config?.system_role || 'system'}`}
                className={classes.chip}
            />
            <Chip
                label={`User: ${item.config_obj?.prompt_config?.user_role || 'user'}`}
                className={classes.chip}
            />
            <Chip
                label={`Assistant: ${item.config_obj?.prompt_config?.assistant_role || 'assistant'}`}
                className={classes.chip}
            />
            <Chip
                label={`Tool: ${item.config_obj?.prompt_config?.tool_role || 'tool'}`}
                className={classes.chip}
            />
        </Box>
    );

    const renderModelCostsChips = () => (
        <Box className={classes.chipContainer}>
            <Chip
                icon={<AttachMoney />}
                label={`Input: $${item.model_costs?.input_token_cost_per_million?.toFixed(3) || '0.150'}/M`}
                className={classes.chip}
            />
            <Chip
                icon={<Cached />}
                label={`Cached: $${item.model_costs?.cached_input_token_cost_per_million?.toFixed(3) || '0.075'}/M`}
                className={classes.chip}
            />
            <Chip
                icon={<AttachMoney />}
                label={`Output: $${item.model_costs?.output_token_cost_per_million?.toFixed(3) || '0.600'}/M`}
                className={classes.chip}
            />
        </Box>
    );

    const listItems = [
        { icon: <Info />, primary_text: "Model Name", secondary_text: item.model_name || 'N/A' },
        { icon: apiNameIcons[item.api_name] || <Api />, primary_text: "API Name", secondary_text: formatCamelCaseString(item.api_name) },
        { icon: modelTypeIcons[item.model_type] || <Category/>, primary_text: "Model Type", secondary_text: formatCamelCaseString(item.model_type) },
        { icon: <Memory />, primary_text: "Context Size", secondary_text: item.config_obj?.ctx_size ? `${item.config_obj.ctx_size} tokens` : 'N/A' },
        {
            icon: <Settings />,
            primary_text: "Model Configuration",
            secondary_text: renderModelConfigChips()
        },
        {
            icon: <Message />,
            primary_text: "Prompt Configuration",
            secondary_text: renderPromptConfigChips()
        },
        {
            icon: <AttachMoney />,
            primary_text: "Model Costs",
            secondary_text: renderModelCostsChips()
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created at",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        }
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
        </CommonCardView>
    );
};

export default ModelCardView;