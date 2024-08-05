import React from 'react';
import {
    Typography,
    List,
    ListItemIcon,
    ListItemText,
    Card,
    CardContent,
    Box,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    ListItem,
} from '@mui/material';
import { Code, ExpandMore, Assignment, QueryBuilder } from '@mui/icons-material';
import { PromptComponentProps } from '../../../../utils/PromptTypes';
import useStyles from '../PromptStyles';

const PromptCardView: React.FC<PromptComponentProps> = ({
    item,
    handleParameterClick,
}) => {
    const classes = useStyles();

    if (!item) {
        return <Typography>No prompt data available.</Typography>;
    }

    return (
        <Card className={classes.card}>
            <CardContent>
                <Typography variant="h5" className={classes.title}>{item.name}</Typography>
                <Typography variant="caption" className={classes.promptId}>
                    Prompt ID: {item._id}
                </Typography>

                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography>Prompt Content</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" className={classes.content}>{item.content}</Typography>
                    </AccordionDetails>
                </Accordion>

                <List className={classes.list}>
                    <ListItem>
                        <ListItemIcon><Code /></ListItemIcon>
                        <ListItemText primary="Templated" secondary={item.is_templated ? 'Yes' : 'No'} />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><QueryBuilder /></ListItemIcon>
                        <ListItemText primary="Created at" secondary={new Date(item.createdAt || '').toLocaleString()} />
                    </ListItem>
                    {item.version !== undefined && (
                        <ListItem>
                            <ListItemIcon><Assignment /></ListItemIcon>
                            <ListItemText primary="Version" secondary={item.version} />
                        </ListItem>
                    )}
                </List>

                {item.parameters && (
                    <Box className={classes.section}>
                        <Typography variant="subtitle1">Parameters</Typography>
                        <Box className={classes.chipContainer}>
                            {Object.entries(item.parameters.properties).map(([key, param]) => (
                                <Chip
                                    key={key}
                                    label={`${key}: ${param.type}`}
                                    onClick={() => handleParameterClick && handleParameterClick(param._id!)}
                                    className={classes.chip}
                                    color={item.parameters?.required.includes(key) ? "primary" : "default"}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {item.partial_variables && Object.keys(item.partial_variables).length > 0 && (
                    <Box className={classes.section}>
                        <Typography variant="subtitle1">Partial Variables</Typography>
                        <Box className={classes.chipContainer}>
                            {Object.keys(item.partial_variables).map((key) => (
                                <Chip
                                    key={key}
                                    label={key}
                                    className={classes.chip}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PromptCardView;