import React from 'react';
import {
    Typography,
    Card,
    CardContent,
    Box,
    List,
    ListItem,
    ListItemIcon,
} from '@mui/material';
import { CollectionName, CollectionPopulatedType } from '../../../../types/CollectionTypes';
import useStyles from './EnhancedStyles';
import EntityActionsMenu from '../entity_menu/EntityActionsMenu';

interface ListItemData {
    icon: React.ReactElement;
    primary_text: string;
    secondary_text: React.ReactNode;
}

interface CommonCardViewProps<T extends CollectionName> {
    title: string;
    elementType?: string;
    subtitle?: string | React.ReactNode;
    id?: string;
    listItems?: ListItemData[];
    children?: React.ReactNode;
    item?: CollectionPopulatedType[T];
    itemType?: T;
}

const CommonCardView = <T extends CollectionName>({
    title,
    elementType,
    subtitle,
    id,
    listItems,
    children,
    item,
    itemType
}: CommonCardViewProps<T>) => {
    const classes = useStyles();

    return (
        <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
                <Box className={classes.titleContainer}>
                    {elementType && (
                        <Typography variant="caption" className={classes.elementType}>
                            {elementType}
                        </Typography>
                    )}
                    <Box className={classes.titleContent}>
                        <Typography variant="h5" className={classes.title}>
                            {title}
                        </Typography>
                        {item && itemType && (
                            <Box className={classes.downloadButton}>
                                <EntityActionsMenu item={item} itemType={itemType} />
                            </Box>
                        )}
                    </Box>
                </Box>
                {id && (
                    <Typography variant="caption" className={classes.id}>
                        ID: {id}
                    </Typography>
                )}
                {subtitle && (
                    <Typography variant="subtitle1" className={classes.subtitle}>{subtitle}</Typography>
                )}
                {listItems && listItems.length > 0 && (
                    <List className={classes.cardList}>
                        {listItems.map((item, index) => (
                            <ListItem key={index} className={classes.listItem}>
                                <ListItemIcon className={classes.listItemIcon}>{item.icon}</ListItemIcon>
                                <Box className={classes.listItemContent}>
                                    <Typography className={classes.primaryText}>
                                        {item.primary_text}
                                    </Typography>
                                    <Box className={classes.secondaryText}>{item.secondary_text}</Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                )}
                {children && <Box>{children}</Box>}
            </CardContent>
        </Card>
    );
};

export default CommonCardView;