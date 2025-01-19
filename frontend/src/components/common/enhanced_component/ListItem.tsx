import React, { useCallback } from 'react';
import {
  ListItem,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Divider,
  Theme,
} from '@mui/material';
import { Visibility, ChevronRight } from '@mui/icons-material';
import { makeStyles } from '@mui/styles';
import { CollectionElementString } from '../../../types/CollectionTypes';
import { formatStringWithSpaces, hexToRgba } from '../../../utils/StyleUtils';

const useStyles = makeStyles((theme: Theme) => ({
  listItem: {
    display: 'flex !important',
    justifyContent: 'space-between !important',
    alignItems: 'center !important',
    padding: `${theme.spacing(2, 2)} !important`,
    position: 'relative',
    backgroundColor: `${theme.palette.background.paper} !important`,
    border: `1px solid ${theme.palette.divider} !important`,
    transition: 'all 0.1s ease-in-out !important',
    '&:hover': {
      transform: 'translateY(-1px)',
      '& $caption': {
        opacity: 1,
        visibility: 'visible',
      },
    },
  },
  contentBox: {
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  buttonBox: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '40px',
  },
  caption: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: '0.55rem',
    padding: '0 1px',
    backgroundColor: hexToRgba(theme.palette.primary.main, 0.4),
    color: theme.palette.primary.contrastText,
    borderRadius: 4,
    zIndex: 1,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
  },
}));

function truncateText(
  text: string,
  maxLength: number
): { truncated: string; isTruncated: boolean } {
  if (text.length <= maxLength) {
    return { truncated: text, isTruncated: false };
  }
  return { truncated: text.slice(0, maxLength) + '...', isTruncated: true };
}

interface EnhancedListItemProps<T> {
  item: T;
  primaryText: string;
  secondaryText: React.ReactNode;
  onView?: (item: T) => void;
  onInteraction?: (item: T) => void;
  interactionTooltip?: string;
  viewTooltip?: string;
  maxCharacters: number;
  collectionElement?: CollectionElementString; // Made optional
}

function EnhancedListItemComponent<T>({
  item,
  primaryText,
  secondaryText,
  onView,
  onInteraction,
  interactionTooltip = 'Select Item',
  viewTooltip = 'View Item',
  maxCharacters,
  collectionElement,
}: EnhancedListItemProps<T>) {
  const classes = useStyles();
  const handleView = useCallback(() => onView?.(item), [onView, item]);
  const handleInteraction = useCallback(() => onInteraction?.(item), [onInteraction, item]);

  const { truncated: truncatedPrimaryText, isTruncated: isPrimaryTruncated } =
    truncateText(formatStringWithSpaces(primaryText), maxCharacters);

  const renderSecondaryText = () => {
    if (typeof secondaryText === 'string') {
      const { truncated, isTruncated } = truncateText(secondaryText, maxCharacters);
      return isTruncated ? (
        <Tooltip title={secondaryText}>
          <Box>{truncated}</Box>
        </Tooltip>
      ) : (
        <Box>{truncated}</Box>
      );
    }
    return <Box>{secondaryText}</Box>;
  };

  const primaryTextElement = isPrimaryTruncated ? (
    <Tooltip title={primaryText}>
      <Typography variant="body1">{truncatedPrimaryText}</Typography>
    </Tooltip>
  ) : (
    <Typography variant="body1">{truncatedPrimaryText}</Typography>
  );

  return (
    <>
      <ListItem className={classes.listItem}>
        {collectionElement && (
          <Typography variant="caption" className={classes.caption}>
            {collectionElement}
          </Typography>
        )}
        <Box className={classes.contentBox}>
          {primaryTextElement}
          {renderSecondaryText()}
        </Box>
        <Box className={classes.buttonBox}>
          {onView && (
            <IconButton size="small" onClick={handleView} title={viewTooltip}>
              <Visibility />
            </IconButton>
          )}
          {onInteraction && (
            <IconButton size="small" onClick={handleInteraction} title={interactionTooltip}>
              <ChevronRight />
            </IconButton>
          )}
        </Box>
      </ListItem>
      <Divider />
    </>
  );
}

const EnhancedListItem = React.memo(
  EnhancedListItemComponent
) as <T>(props: EnhancedListItemProps<T>) => JSX.Element;

export default EnhancedListItem;
