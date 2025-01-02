import { memo } from 'react';
import { Box, ButtonGroup, ToggleButtonGroup, ToggleButton, Tooltip, Button } from '@mui/material';
import {
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import { ACTION_BUTTON_CONFIG } from './DataClusterManagerTypes';
import DataClusterShortListView from '../data_cluster/DataClusterShortListView';
import { useDialog } from '../../../../contexts/DialogContext';
import { ViewType } from './DataClusterManagerTypes';

interface DataClusterHeaderProps {
    editedCluster: PopulatedDataCluster | undefined;
    viewType: ViewType;
    setViewType: (value: ViewType) => void;
    isEditable: boolean;
    showEdit: boolean;
    showSelect: boolean;
    onEdit?: () => void;
    dataCluster: PopulatedDataCluster | undefined;
    onDataClusterChange?: (dataCluster: PopulatedDataCluster | undefined) => void;
    inEditMode: boolean;
}

const DataClusterHeader = memo(({
    editedCluster,
    viewType,
    setViewType,
    isEditable,
    showEdit,
    showSelect,
    onEdit,
    dataCluster,
    onDataClusterChange,
    inEditMode
}: DataClusterHeaderProps) => {
    const { selectDialog } = useDialog();

    const handleSelect = async (selectedCluster: PopulatedDataCluster) => {
        if (isEditable && onDataClusterChange) {
            onDataClusterChange(selectedCluster);
        }
    };

    const handleAction = (key: string) => {
        if (key === 'select') {
            selectDialog<PopulatedDataCluster>(
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
        if (inEditMode || !editedCluster || !hasAnyReferences(editedCluster as References)) return null;

        return (
            <Box className="absolute top-0 right-0">
                <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={(_, newValue) => newValue && setViewType(newValue)}
                    size="small"
                    className="bg-white/50"
                >
                    <ToggleButton value="flat">
                        <Tooltip title="Flat View">
                            <ViewListIcon />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="categorized">
                        <Tooltip title="Categorized View">
                            <ViewModuleIcon />
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="reference">
                        <Tooltip title="Reference View">
                            <DescriptionIcon />
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
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