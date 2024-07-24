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
import { Visibility, ChevronRight } from '@mui/icons-material';

interface EnhancedListItemProps<T> {
    item: T;
    primaryText: string;
    secondaryText: React.ReactNode;
    onView?: (item: T) => void;
    onInteraction?: (item: T) => void;
    interactionTooltip?: string;
    viewTooltip?: string;
}

function EnhancedListItem<T>({ 
    item, 
    primaryText, 
    secondaryText, 
    onView, 
    onInteraction,
    interactionTooltip = "Select Item",
    viewTooltip = "View Item"
}: EnhancedListItemProps<T>) {
    return (
        <ListItem>
            <ListItemText
                primary={primaryText}
                secondary={secondaryText}
            />
            <Box>
                {onView && (
                    <Tooltip title={viewTooltip}>
                        <IconButton edge="end" onClick={() => onView(item)}>
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                )}
                {onInteraction && (
                    <Tooltip title={interactionTooltip}>
                        <IconButton edge="end" onClick={() => onInteraction(item)}>
                            <ChevronRight />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </ListItem>
    );
}

interface EnhancedListViewProps<T> {
    items: T[] | null;
    item: T | null;
    getPrimaryText: (item: T) => string;
    getSecondaryText: (item: T) => React.ReactNode;
    onView?: (item: T) => void;
    onInteraction?: (item: T) => void;
    interactionTooltip?: string;
    viewTooltip?: string;
}

function EnhancedListView<T>({
    items,
    item,
    getPrimaryText,
    getSecondaryText,
    onView,
    onInteraction,
    interactionTooltip,
    viewTooltip,
}: EnhancedListViewProps<T>) {
    if (!items && !item) {
        return <Typography>No data available.</Typography>;
    }

    const renderItem = (itemToRender: T) => (
        <EnhancedListItem
            key={getPrimaryText(itemToRender)}
            item={itemToRender}
            primaryText={getPrimaryText(itemToRender)}
            secondaryText={getSecondaryText(itemToRender)}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip={interactionTooltip}
            viewTooltip={viewTooltip}
        />
    );

    return (
        <List>
            {item ? renderItem(item) : items!.map(renderItem)}
        </List>
    );
}

export default EnhancedListView;