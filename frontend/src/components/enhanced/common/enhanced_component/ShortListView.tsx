import React from 'react';
import {
    List,
    ListItem,
    Typography,
    Box,
    IconButton,
    Tooltip
} from '@mui/material';
import { Visibility, PlayArrow } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ListItemStyled = styled(ListItem)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1),
}));

const ContentBox = styled(Box)({
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const ButtonBox = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
});

const IconButtonCustom = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(0.25) + ' !important',
}));

interface EnhancedShortListItemProps<T> {
    item: T;
    primaryText: string;
    secondaryText: string;
    onView?: (item: T) => void;
    onInteraction?: (item: T) => void;
}

function EnhancedShortListItem<T>({
    item,
    primaryText,
    secondaryText,
    onView,
    onInteraction
}: EnhancedShortListItemProps<T>) {
    return (
        <ListItemStyled>
            <ContentBox>
                <Typography variant="body1">{primaryText}</Typography>
                <Typography variant="body2" color="textSecondary">
                    {secondaryText}
                </Typography>
            </ContentBox>
            <ButtonBox>
                {onView && (
                    <Tooltip title="View Item">
                        <IconButtonCustom size="small" onClick={() => onView(item)}>
                            <Visibility />
                        </IconButtonCustom>
                    </Tooltip>
                )}
                {onInteraction && (
                    <Tooltip title="Select Item">
                        <IconButtonCustom size="small" onClick={() => onInteraction(item)}>
                            <PlayArrow />
                        </IconButtonCustom>
                    </Tooltip>
                )}
            </ButtonBox>
        </ListItemStyled>
    );
}

interface EnhancedShortListViewProps<T> {
    items: T[] | null;
    item: T | null;
    getPrimaryText: (item: T) => string;
    getSecondaryText: (item: T) => string;
    onView?: (item: T) => void;
    onInteraction?: (item: T) => void;
}

function EnhancedShortListView<T>({
    items,
    item,
    getPrimaryText,
    getSecondaryText,
    onView,
    onInteraction,
}: EnhancedShortListViewProps<T>) {
    if (!items && !item) {
        return <Typography>No data available.</Typography>;
    }

    const renderItem = (itemToRender: T) => (
        <EnhancedShortListItem
            key={Math.random().toString(36).substr(2, 9)}
            item={itemToRender}
            primaryText={getPrimaryText(itemToRender)}
            secondaryText={getSecondaryText(itemToRender)}
            onView={onView}
            onInteraction={onInteraction}
        />
    );

    return (
        <List>
            {item ? renderItem(item) : items!.map(renderItem)}
        </List>
    );
}

export default EnhancedShortListView;