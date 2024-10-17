import { IconButton, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/system';
import { CollectionName, collectionNameToElementString, CollectionType } from '../../../../types/CollectionTypes';
import { removeCreatedUpdatedBy } from '../../../../utils/AuthUtils';

interface DownloadEntityProps<T extends CollectionName> {
    item: CollectionType[T];
    itemType: T;
    tooltipText?: string;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.primary.light,
    '&:hover': {
        color: theme.palette.primary.dark,
    },
}));

export function DownloadEntity<T extends CollectionName>({
    item,
    itemType,
    tooltipText
}: DownloadEntityProps<T>) {
    const handleDownload = () => {
        const fileName = `${collectionNameToElementString[itemType]}${item._id ? '_' + item._id : ''}.json`;
        const cleanedItem = removeCreatedUpdatedBy(item);
        const json = JSON.stringify(cleanedItem, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const defaultTooltip = `Download ${collectionNameToElementString[itemType]}`;

    return (
        <Tooltip title={tooltipText || defaultTooltip}>
            <StyledIconButton onClick={handleDownload} size="small">
                <DownloadIcon />
            </StyledIconButton>
        </Tooltip>
    );
}