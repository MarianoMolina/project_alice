import React from 'react';
import {
    List,
    ListItem,
    ListItemText,
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
    padding: theme.spacing(1, 2),
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
    width: '48px', // Reduced width for stacked buttons
});

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
                <ListItemText
                    primary={primaryText}
                    secondary={
                        <Typography component="span" variant="body2" color="textSecondary">
                            {secondaryText}
                        </Typography>
                    }
                />
            </ContentBox>
            <ButtonBox>
                {onView && (
                    <Tooltip title="View Item">
                        <IconButton size="small" onClick={() => onView(item)}>
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                )}
                {onInteraction && (
                    <Tooltip title="Select Item">
                        <IconButton size="small" onClick={() => onInteraction(item)}>
                            <PlayArrow />
                        </IconButton>
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
            key={getPrimaryText(itemToRender)}
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