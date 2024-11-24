import { memo } from 'react';
import { Box, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import {
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { hasAnyReferences } from '../../../../types/ReferenceTypes';
import { ACTION_BUTTON_CONFIG } from './DataClusterManagerTypes';
import DataClusterShortListView from '../data_cluster/DataClusterShortListView';
import { useCardDialog } from '../../../../contexts/CardDialogContext';

interface DataClusterHeaderProps {
    editedCluster: DataCluster | undefined;
    isFlatView: boolean;
    setIsFlatView: (value: boolean) => void;
    isEditable: boolean;
    showEdit: boolean;
    showSelect: boolean;
    onEdit?: () => void;
    dataCluster: DataCluster | undefined;
    onDataClusterChange?: (dataCluster: DataCluster | undefined) => void;
    inEditMode: boolean;
}

const DataClusterHeader = memo(({
    editedCluster,
    isFlatView,
    setIsFlatView,
    isEditable,
    showEdit,
    showSelect,
    onEdit,
    dataCluster,
    onDataClusterChange,
    inEditMode
}: DataClusterHeaderProps) => {
    const { selectDialog } = useCardDialog();

    const handleSelect = async (selectedCluster: DataCluster) => {
        if (isEditable && onDataClusterChange) {
            onDataClusterChange(selectedCluster);
        }
    };

    const handleAction = (key: string) => {
        if (key === 'select') {
            selectDialog<DataCluster>(
                'dataclusters',
                DataClusterShortListView,
                'Select Data Cluster',
                handleSelect,
                dataCluster ? [dataCluster] : []
            );
        } else {
            onEdit && onEdit();
        }
    };

    const renderViewToggle = () => {
        // Only show view toggle when not in edit mode and there are references
        if (inEditMode || !editedCluster || !hasAnyReferences(editedCluster)) return null;

        return (
            <Box className="absolute top-4 right-4">
                <Tooltip title={isFlatView ? "Show Categorized View" : "Show Flat View"}>
                    <IconButton
                        onClick={() => setIsFlatView(!isFlatView)}
                        size="small"
                        className="bg-white/50 hover:bg-white/75"
                    >
                        {isFlatView ? <ViewListIcon /> : <ViewModuleIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
        );
    };

    const renderActionButtons = () => {
        if (!isEditable) return null;

        return (
            <Box className="mb-4">
                <ButtonGroup>
                    {ACTION_BUTTON_CONFIG.map(({ 
                        key, 
                        label, 
                        icon: Icon, 
                        showCondition, 
                        disabled, 
                        variant, 
                        color
                    }) => {
                        const isVisible = showCondition(
                            { 
                                dataCluster, 
                                onDataClusterChange, 
                                isEditable, 
                                showEdit, 
                                showSelect,
                                inEditMode
                            },
                            isEditable,
                            inEditMode
                        );

                        const isDisabled = typeof disabled === 'function' ?
                            disabled({ 
                                dataCluster, 
                                onDataClusterChange, 
                                isEditable, 
                                showEdit, 
                                showSelect,
                                inEditMode
                            }) :
                            disabled;

                        if (!isVisible) return null;

                        return (
                            <Button
                                key={key}
                                startIcon={<Icon />}
                                onClick={() => handleAction(key)}
                                variant={variant}
                                size="small"
                                disabled={isDisabled}
                                color={color}
                                className="min-w-[100px]"
                            >
                                {label}
                            </Button>
                        );
                    })}
                </ButtonGroup>
            </Box>
        );
    };

    return (
        <>
            {renderViewToggle()}
            {renderActionButtons()}
        </>
    );
});

export default DataClusterHeader;