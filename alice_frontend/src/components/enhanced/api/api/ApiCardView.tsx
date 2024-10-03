import React from 'react';
import {
    Typography,
    Switch,
    ListItemSecondaryAction,
    ListItemButton,
} from '@mui/material';
import { ApiComponentProps } from '../../../../types/ApiTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { Api, Category, HealthAndSafety, PowerSettingsNew } from '@mui/icons-material';

const ApiCardView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
    handleModelClick
}) => {
    if (!item) {
        return <Typography>No API data available.</Typography>;
    }

    const handleToggleActive = () => {
        if (onChange) {
            onChange({ ...item, is_active: !item.is_active });
        }
    };

    const listItems = [
        {
            icon: <Api />,
            primary_text: "API Type",
            secondary_text: item.api_type
        },
        {
            icon: <HealthAndSafety />,
            primary_text: "Status",
            secondary_text: item.health_status
        },
        {
            icon: <PowerSettingsNew />,
            primary_text: "Active",
            secondary_text: (
                <ListItemSecondaryAction>
                    <Switch
                        edge="end"
                        checked={item.is_active}
                        onChange={handleToggleActive}
                        color="primary"
                    />
                </ListItemSecondaryAction>
            )
        },
        {
            icon: <Category />,
            primary_text: "Default Model",
            secondary_text: (item.default_model ?
                <ListItemButton onClick={() => item.default_model?._id && handleModelClick && handleModelClick(item.default_model._id)}>
                    {item.default_model?.model_name || 'N/A'}
                </ListItemButton>
                : "N/A"
            )
        }
    ];

    return (
        <CommonCardView
            elementType='API'
            title={item.name ?? 'API'}
            id={item._id}
            listItems={listItems}
            item={item}
            itemType='apis'
        />
    );
};

export default ApiCardView;