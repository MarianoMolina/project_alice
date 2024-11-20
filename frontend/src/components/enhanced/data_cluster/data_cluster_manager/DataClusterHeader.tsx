import { memo } from 'react';
import { Box, Button, ButtonGroup, IconButton, Tooltip } from '@mui/material';
import {
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { hasAnyReferences } from '../../../../types/ReferenceTypes';
import { ACTION_BUTTON_CONFIG } from './DataClusterManagerTypes';
import { Dialog } from '@mui/material';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import DataClusterShortListView from '../data_cluster/DataClusterShortListView';
import { useState } from 'react';

interface DataClusterHeaderProps {
    editedCluster: DataCluster | undefined;
    isFlatView: boolean;
    setIsFlatView: (value: boolean) => void;
    isEditable: boolean;
    isDirty: boolean;
    showEdit: boolean;
    showSelect: boolean;
    onAction: (key: string) => void;
    dataCluster: DataCluster | undefined;
    onDataClusterChange?: (dataCluster: DataCluster | undefined) => void;
    inEditMode: boolean;
}

const DataClusterHeader = memo(({
    editedCluster,
    isFlatView,
    setIsFlatView,
    isEditable,
    isDirty,
    showEdit,
    showSelect,
    onAction,
    dataCluster,
    onDataClusterChange,
    inEditMode
}: DataClusterHeaderProps) => {
    const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);

    const handleSelect = (selectedIds: string[]) => {
        if (selectedIds.length > 0 && isEditable && onDataClusterChange) {
            setIsSelectDialogOpen(false);
            onDataClusterChange({ _id: selectedIds[0] } as DataCluster);
        }
    };

    const handleAction = (key: string) => {
        if (key === 'select') {
            setIsSelectDialogOpen(true);
        } else {
            onAction(key);
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
                                showSelect 
                            },
                            isDirty,
                            isEditable,
                            inEditMode
                        );

                        const isDisabled = typeof disabled === 'function' ?
                            disabled({ 
                                dataCluster, 
                                onDataClusterChange, 
                                isEditable, 
                                showEdit, 
                                showSelect 
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
            
            <Dialog
                open={isSelectDialogOpen}
                onClose={() => setIsSelectDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <Box className="p-4">
                    <EnhancedSelect<DataCluster>
                        componentType="dataclusters"
                        EnhancedView={DataClusterShortListView}
                        selectedItems={dataCluster ? [dataCluster] : []}
                        onSelect={handleSelect}
                        isInteractable={true}
                        multiple={false}
                        label="Select Data Cluster"
                        activeAccordion={null}
                        onAccordionToggle={() => {}}
                        accordionEntityName="data-cluster"
                    />
                </Box>
            </Dialog>
        </>
    );
});

export default DataClusterHeader;