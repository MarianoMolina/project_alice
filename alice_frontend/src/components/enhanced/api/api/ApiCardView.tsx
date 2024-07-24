import React from 'react';
import {
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Switch,
} from '@mui/material';
import { ApiComponentProps } from '../../../../utils/ApiTypes';

const ApiCardView: React.FC<ApiComponentProps> = ({
    item,
    onChange,
}) => {
    if (!item) {
        return <Typography>No API data available.</Typography>;
    }

    const handleToggleActive = () => {
        if (onChange) {
            onChange({ ...item, is_active: !item.is_active });
        }
    };

    return (
        <Card>
            <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography variant="body2">Type: {item.api_type}</Typography>
                <Typography variant="body2">Status: {item.health_status}</Typography>
                <List>
                    <ListItem>
                        <ListItemText primary="Active" />
                        <Switch
                            checked={item.is_active}
                            onChange={handleToggleActive}
                            color="primary"
                        />
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

export default ApiCardView;