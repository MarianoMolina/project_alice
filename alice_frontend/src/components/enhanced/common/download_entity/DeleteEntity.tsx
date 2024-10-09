import { IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { CollectionName, collectionNameToElementString } from '../../../../types/CollectionTypes';
import { Delete } from '@mui/icons-material';

interface DeleteEntityProps<T extends CollectionName> {
    itemType: T;
    tooltipText?: string;
    handleDelete: () => void;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.primary.light,
    '&:hover': {
        color: theme.palette.primary.dark,
    },
}));

export function DeleteEntity<T extends CollectionName>({
    itemType,
    tooltipText,
    handleDelete,
}: DeleteEntityProps<T>) {

    if (!handleDelete) return null;

    const defaultTooltip = `Delete ${collectionNameToElementString[itemType]}`;

    return (
        <Tooltip title={tooltipText || defaultTooltip}>
            <StyledIconButton onClick={handleDelete} size="small">
                <Delete />
            </StyledIconButton>
        </Tooltip>
    );
}