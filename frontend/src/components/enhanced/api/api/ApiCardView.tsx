import React from 'react';
import {
    Typography,
    Switch,
    ListItemSecondaryAction,
    ListItemButton,
    ListItemText,
} from '@mui/material';
import { ApiComponentProps, ApiName, ApiType, ModelApiType } from '../../../../types/ApiTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { Api, Category, PowerSettingsNew, QueryBuilder, Settings } from '@mui/icons-material';
import { useDialog } from '../../../../contexts/DialogContext';
import { apiNameIcons, apiTypeIcons } from '../../../../utils/ApiUtils';
import { AIIcon } from '../../../../utils/CustomIcons';
import { formatStringWithSpaces } from '../../../../utils/StyleUtils';

type ListItemType = {
    icon: React.ReactElement;
    primary_text: string;
    secondary_text: React.ReactNode;
};

const ApiCardView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
}) => {
    const { selectCardItem } = useDialog();

    if (!item) {
        return <Typography>No API data available.</Typography>;
    }

    const handleToggleActive = () => {
        if (onChange) {
            onChange({ ...item, is_active: !item.is_active });
        }
    };

    function isModelApiType(apiType: ApiType): apiType is ApiType & ModelApiType {
        return Object.values(ModelApiType).includes(apiType as any);
    }

    const listItems: ListItemType[] = [
        {
            icon: apiTypeIcons[item.api_type] || <Api />,
            primary_text: "API Type",
            secondary_text: formatStringWithSpaces(item.api_type)
        },
        {
            icon: apiNameIcons[item.api_name as ApiName] || <Category />,
            primary_text: "API Name",
            secondary_text: formatStringWithSpaces(item.api_name)
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
                        disabled
                    />
                </ListItemSecondaryAction>
            )
        },
        {
            icon: <Settings />,
            primary_text: "API Config",
            secondary_text: item.api_config ? (
                <ListItemButton onClick={() => item._id && selectCardItem && selectCardItem('APIConfig', item.api_config._id, item.api_config)}>
                    <ListItemText primary={item.api_config.name} />
                </ListItemButton>
            ) : "N/A"
        },
        {
            icon: <QueryBuilder />,
            primary_text: "Created At",
            secondary_text: new Date(item.createdAt || '').toLocaleString()
        }
    ];

    // Add Default Model section only if item.api_type is ModelApiType
    if (isModelApiType(item.api_type)) {
        listItems.push({
            icon: <AIIcon />,
            primary_text: "Default Model",
            secondary_text: item.default_model ? (
                <ListItemButton onClick={() => item.default_model?._id && selectCardItem && selectCardItem('Model', item.default_model._id, item.default_model)}>
                    {item.default_model?.model_name || 'N/A'}
                </ListItemButton>
            ) : "N/A"
        });
    }

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