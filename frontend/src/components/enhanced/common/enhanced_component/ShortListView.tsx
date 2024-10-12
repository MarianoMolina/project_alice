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
    transition: 'transform 0.1s ease-in-out !important',
    '&:hover': {
      transform: 'translateY(-1px)',
    },
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
    maxCharacters: number;
}

function truncateText(text: string, maxLength: number): { truncated: string, isTruncated: boolean } {
    if (text.length <= maxLength) {
        return { truncated: text, isTruncated: false };
    }
    return { truncated: text.slice(0, maxLength) + '...', isTruncated: true };
}

function EnhancedShortListItem<T>({
    item,
    primaryText,
    secondaryText,
    onView,
    onInteraction,
    maxCharacters
}: EnhancedShortListItemProps<T>) {
    const { truncated: truncatedPrimaryText, isTruncated: isPrimaryTruncated } = truncateText(primaryText, maxCharacters);
    const { truncated: truncatedSecondaryText, isTruncated: isSecondaryTruncated } = truncateText(secondaryText, maxCharacters);

    const renderText = (text: string, truncated: string, isTruncated: boolean, variant: "body1" | "body2") => {
        const TextComponent = (
            <Typography variant={variant} color={variant === "body2" ? "textSecondary" : undefined}>
                {truncated}
            </Typography>
        );

        return isTruncated ? (
            <Tooltip title={text}>
                {TextComponent}
            </Tooltip>
        ) : TextComponent;
    };

    return (
        <ListItemStyled>
            <ContentBox>
                {renderText(primaryText, truncatedPrimaryText, isPrimaryTruncated, "body1")}
                {renderText(secondaryText, truncatedSecondaryText, isSecondaryTruncated, "body2")}
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
    maxCharacters?: number;
}

function EnhancedShortListView<T>({
    items,
    item,
    getPrimaryText,
    getSecondaryText,
    onView,
    onInteraction,
    maxCharacters = 50,
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
            maxCharacters={maxCharacters}
        />
    );

    return (
        <List>
            {item ? renderItem(item) : items!.map(renderItem)}
        </List>
    );
}

export default EnhancedShortListView;