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
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { DownloadEntity } from '../download_entity/DownloadEntity';
import { CollectionName, CollectionType } from '../../../../types/CollectionTypes';

const useStyles = makeStyles((theme: Theme) => ({
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    titleContainer: {
        position: 'relative',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        marginBottom: theme.spacing(1),
    },
    title: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    elementType: {
        position: 'absolute',
        top: -10,
        left: 8,
        fontSize: '0.75rem',
        padding: '0 4px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
    },
    subtitle: {
        marginBottom: theme.spacing(1),
    },
    id: {
        display: 'block',
        marginBottom: theme.spacing(2),
    },
    list: {
        padding: 0,
    },
    listItem: {
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: theme.spacing(2),
    },
    listItemContent: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        marginLeft: theme.spacing(2),
        maxWidth: 'calc(100% - 85px)',
    },
    listItemIcon: {
        minWidth: 'auto',
        marginRight: theme.spacing(2),
        marginTop: theme.spacing(1),
    },
    primaryText: {
        fontWeight: 600,
        fontSize: '1.1rem',
        color: theme.palette.text.primary,
        marginBottom: theme.spacing(0.5),
    },
    secondaryText: {
        width: '100%',
        color: theme.palette.text.secondary,
        fontSize: '0.9rem',
    },
    titleContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    downloadButton: {
        marginLeft: theme.spacing(2),
        color: theme.palette.secondary.light,
    },
}));

interface ListItemData {
    icon: React.ReactElement;
    primary_text: string;
    secondary_text: React.ReactNode;
}

interface CommonCardViewProps<T extends CollectionName> {
    title: string;
    elementType?: string;
    subtitle?: string;
    id?: string;
    listItems?: ListItemData[];
    children?: React.ReactNode;
    item?: CollectionType[T];
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
            <CardContent>
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
                                <DownloadEntity item={item} itemType={itemType} />
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
                    <List className={classes.list}>
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