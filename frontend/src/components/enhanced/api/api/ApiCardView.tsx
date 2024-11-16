import React from 'react';
import {
    Typography,
    Switch,
    ListItemSecondaryAction,
    ListItemButton,
} from '@mui/material';
import { ApiComponentProps, ApiType, ModelApiType } from '../../../../types/ApiTypes';
import CommonCardView from '../../common/enhanced_component/CardView';
import { Api, Category, PowerSettingsNew } from '@mui/icons-material';
import { useCardDialog } from '../../../../contexts/CardDialogContext';

type ListItemType = {
    icon: React.ReactElement;
    primary_text: string;
    secondary_text: React.ReactNode;
};

const ApiCardView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
}) => {
    const { selectCardItem } = useCardDialog();

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
            icon: <Api />,
            primary_text: "API Type",
            secondary_text: item.api_type
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
        }
    ];

    // Add Default Model section only if item.api_type is ModelApiType
    if (isModelApiType(item.api_type)) {
        listItems.push({
            icon: <Category />,
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