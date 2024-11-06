import React, { useState, useCallback } from 'react';
import { Box, Button, ButtonGroup, Dialog, IconButton, Tooltip } from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Save as SaveIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { DataCluster } from '../../../types/DataClusterTypes';
import { hasAnyReferences, References } from '../../../types/ReferenceTypes';
import { useCardDialog } from '../../../contexts/CardDialogContext';
import ReferenceChip from '../common/references/ReferenceChip';
import EnhancedSelect from '../common/enhanced_select/EnhancedSelect';
import DataClusterShortListView from './data_cluster/DataClusterShortListView';
import { CollectionElementString } from '../../../types/CollectionTypes';

// Base props that are always required
type BaseDataClusterManagerProps = {
    dataCluster: DataCluster | undefined;
    showCreate?: boolean;
    showEdit?: boolean;
    showSelect?: boolean;
    flatten?: boolean;
};

// Props when isEditable is true
type EditableProps = BaseDataClusterManagerProps & {
    isEditable: true;
    onDataClusterChange: (dataCluster: DataCluster | undefined) => void;
};

// Props when isEditable is false or undefined
type ReadOnlyProps = BaseDataClusterManagerProps & {
    isEditable?: false;
    onDataClusterChange?: never;
};

// Combined props type
type DataClusterManagerProps = EditableProps | ReadOnlyProps;

interface ActionButtonConfig {
    key: string;
    label: string;
    icon: typeof AddIcon;
    showCondition: (props: DataClusterManagerProps, isDirty: boolean, isEditable: boolean) => boolean;
    disabled: boolean | ((props: DataClusterManagerProps) => boolean);
    variant: 'outlined' | 'contained';
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

type ReferenceConfig = {
    key: keyof References;
    title: string;
    chipType: CollectionElementString;
};

// Define the mapping between reference types and their display properties
const REFERENCE_TYPE_CONFIG: ReferenceConfig[] = [
    {
        key: 'messages',
        title: 'Messages',
        chipType: 'Message',
    },
    {
        key: 'files',
        title: 'Files',
        chipType: 'File',
    },
    {
        key: 'task_responses',
        title: 'Task Responses',
        chipType: 'TaskResponse',
    },
    {
        key: 'url_references',
        title: 'URL References',
        chipType: 'URLReference',
    },
    {
        key: 'embeddings',
        title: 'Embeddings',
        chipType: 'EmbeddingChunk',
    }
];

// Define the action button configurations
const ACTION_BUTTON_CONFIG: ActionButtonConfig[] = [
    {
        key: 'create',
        label: 'Create New',
        icon: AddIcon,
        showCondition: (props) => Boolean(props.showCreate && props.isEditable),
        disabled: false,
        variant: 'outlined',
        color: 'secondary',
    },
    {
        key: 'edit',
        label: 'Edit',
        icon: EditIcon,
        showCondition: (props) => Boolean(props.showEdit && props.isEditable),
        disabled: (props) => !props.dataCluster,
        variant: 'outlined',
        color: 'info',
    },
    {
        key: 'select',
        label: 'Select Existing',
        icon: SearchIcon,
        showCondition: (props) => Boolean(props.showSelect && props.isEditable),
        disabled: false,
        variant: 'outlined',
        color: 'info',
    },
    {
        key: 'save',
        label: 'Save Changes',
        icon: SaveIcon,
        showCondition: (_, isDirty, isEditable) => Boolean(isDirty && isEditable),
        disabled: false,
        variant: 'contained',
        color: 'info',
    }
];

const DataClusterManager: React.FC<DataClusterManagerProps> = ({
    dataCluster,
    onDataClusterChange,
    isEditable = false,
    showCreate = true,
    showEdit = true,
    showSelect = true,
    flatten = true
}) => {
    const { selectFlexibleItem } = useCardDialog();
    const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [editedCluster, setEditedCluster] = useState<DataCluster | undefined>(dataCluster);
    const [isFlatView, setIsFlatView] = useState(flatten);

    const handleAction = useCallback((actionKey: string) => {
        switch (actionKey) {
            case 'create':
                selectFlexibleItem('DataCluster', 'create', undefined, undefined);
                break;
            case 'edit':
                if (dataCluster) {
                    selectFlexibleItem('DataCluster', 'edit', dataCluster._id, dataCluster);
                }
                break;
            case 'select':
                setIsSelectDialogOpen(true);
                break;
            case 'save':
                if (editedCluster && isEditable && onDataClusterChange) {
                    onDataClusterChange(editedCluster);
                    setIsDirty(false);
                }
                break;
        }
    }, [dataCluster, editedCluster, onDataClusterChange, selectFlexibleItem, isEditable]);

    const handleSelect = useCallback((selectedIds: string[]) => {
        if (selectedIds.length > 0 && isEditable && onDataClusterChange) {
            setIsSelectDialogOpen(false);
            onDataClusterChange({ _id: selectedIds[0] } as DataCluster);
        }
    }, [onDataClusterChange, isEditable]);

    const handleDelete = useCallback((type: keyof References, index: number) => {
        if (!editedCluster || !isEditable) return;

        setEditedCluster(prev => {
            if (!prev || !Array.isArray(prev[type])) return prev;

            const newArray = [...prev[type]];
            newArray.splice(index, 1);

            return {
                ...prev,
                [type]: newArray
            };
        });
        setIsDirty(true);
    }, [editedCluster, isEditable]);

    const renderReferenceChip = useCallback((reference: NonNullable<References[keyof References]>[number], index: number, type: keyof References, chipType: CollectionElementString) => {
        if (typeof reference === 'string') {
            return (
                <ReferenceChip
                    key={`${type}-${index}`}
                    reference={reference}
                    type="string_output"
                    view={true}
                    delete={isEditable}
                    onDelete={() => handleDelete(type, index)}
                />
            );
        }

        return (
            <ReferenceChip
                key={reference._id || `${type}-${index}`}
                reference={reference}
                type={chipType}
                view={true}
                delete={isEditable}
                onDelete={() => handleDelete(type, index)}
            />
        );
    }, [isEditable, handleDelete]);

    const renderFlatReferences = useCallback(() => {
        if (!editedCluster || !hasAnyReferences(editedCluster)) {
            return <div className="text-gray-500 italic">No references available</div>;
        }

        return (
            <Box className="flex flex-wrap gap-2">
                {REFERENCE_TYPE_CONFIG.map(({ key, chipType }) => {
                    const references = editedCluster[key];
                    if (!references || references.length === 0) return null;

                    return references.map((reference, index) =>
                        renderReferenceChip(reference, index, key, chipType)
                    );
                })}
            </Box>
        );
    }, [editedCluster, renderReferenceChip]);

    const renderCategorizedReferences = useCallback(() => {
        if (!editedCluster || !hasAnyReferences(editedCluster)) {
            return <div className="text-gray-500 italic">No references available</div>;
        }

        return (
            <Box className="space-y-4">
                {REFERENCE_TYPE_CONFIG.map(({ key, title, chipType }) => {
                    const references = editedCluster[key];

                    if (!references || references.length === 0) return null;

                    return (
                        <div key={key} className="space-y-2">
                            <div className="font-medium">{title}:</div>
                            <div className="flex flex-wrap gap-2">
                                {references.map((reference, index) =>
                                    renderReferenceChip(reference, index, key, chipType)
                                )}
                            </div>
                        </div>
                    );
                })}
            </Box>
        );
    }, [editedCluster, renderReferenceChip]);

    const renderToggle = () => (
        editedCluster && hasAnyReferences(editedCluster) && (
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
        )
    );

    const renderActionButtons = useCallback(() => {
        if (!isEditable) return null;

        return (
            <Box className="mb-4">
                <ButtonGroup>
                    {ACTION_BUTTON_CONFIG.map(({ key, label, icon: Icon, showCondition, disabled, variant, color }) => {
                        const isVisible = showCondition(
                            { dataCluster, onDataClusterChange, isEditable, showCreate, showEdit, showSelect } as DataClusterManagerProps,
                            isDirty,
                            isEditable
                        );
                        const isDisabled = typeof disabled === 'function' ?
                            disabled({ dataCluster, onDataClusterChange, isEditable, showCreate, showEdit, showSelect } as DataClusterManagerProps) :
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
                            >
                                {label}
                            </Button>
                        );
                    })}
                </ButtonGroup>
            </Box>
        );
    }, [dataCluster, isDirty, isEditable, showCreate, showEdit, showSelect, handleAction, onDataClusterChange]);

    return (
        <div className="relative p-4 border rounded-lg shadow-sm">
            {/* Fixed position toggle */}
            {renderToggle()}

            {/* Conditional button section */}
            {renderActionButtons()}

            {/* Main content with right padding to accommodate toggle */}
            <Box className="pr-12">
                {isFlatView ? renderFlatReferences() : renderCategorizedReferences()}
            </Box>

            <Dialog
                open={isSelectDialogOpen}
                onClose={() => setIsSelectDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                    <EnhancedSelect<DataCluster>
                        componentType="dataclusters"
                        EnhancedView={DataClusterShortListView}
                        selectedItems={dataCluster ? [dataCluster] : []}
                        onSelect={handleSelect}
                        isInteractable={true}
                        multiple={false}
                        label="Select Data Cluster"
                        activeAccordion={null}
                        onAccordionToggle={() => { }}
                        accordionEntityName="data-cluster"
                    />
            </Dialog>
        </div>
    );
}

export default DataClusterManager;