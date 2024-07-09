import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
} from '@mui/material';
import { ParameterDefinition, ParameterComponentProps } from '../../../utils/ParameterTypes';
import useStyles from '../ParameterStyles';

const ParameterListView: React.FC<ParameterComponentProps> = ({
    items,
    isInteractable = false,
    onInteraction,
}) => {
    const classes = useStyles();
    if (!items) return null;
    return (
        <List>
            {items.map((parameter: ParameterDefinition) => (
                <ListItem key={parameter._id} onClick={() => onInteraction && onInteraction(parameter)} className={isInteractable ? classes.interactable : ''}>
                    <ListItemText
                        primary={parameter.description}
                        secondary={
                            <>
                                <Typography component="span" variant="body2" color="textPrimary">
                                    Type: {parameter.type || 'N/A'}
                                </Typography>
                                <br />
                                <Typography component="span" variant="body2" color="textSecondary">
                                    Created: {new Date(parameter.createdAt || '').toLocaleString()}
                                </Typography>
                            </>
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
};

export default ParameterListView;