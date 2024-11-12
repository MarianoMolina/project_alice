import React, { useState } from 'react';
import { Box, Typography, IconButton, Dialog } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import { CollectionType } from '../../../../types/CollectionTypes';
import ReferenceChip from '../../common/references/ReferenceChip';
import EnhancedSelect from '../../common/enhanced_select/EnhancedSelect';
import { REFERENCE_CONFIG } from './DataClusterManagerTypes';
import { useApi } from '../../../../contexts/ApiContext';

interface DataClusterEditingViewProps {
    editedCluster: DataCluster;
    onClusterChange: (newCluster: DataCluster) => void;
}

const DataClusterEditingView: React.FC<DataClusterEditingViewProps> = ({
    editedCluster,
    onClusterChange
}) => {
    const { fetchItem } = useApi();
    const [activeDialog, setActiveDialog] = useState<keyof References | null>(null);
    const [selectedIds, setSelectedIds] = useState<{ [K in keyof References]?: string[] }>({});

    const handleAddClick = (referenceType: keyof References) => {
        setActiveDialog(referenceType);
        setSelectedIds(prev => ({
            ...prev,
            [referenceType]: editedCluster[referenceType]?.map(item => 
                typeof item === 'string' ? item : item._id!
            ) || []
        }));
    };

    const handleSelectionConfirm = async (type: keyof References) => {
        if (!selectedIds[type] || !type) return;

        const config = REFERENCE_CONFIG.find(c => c.key === type);
        if (!config?.collectionName) return;

        const newRefs = await Promise.all(
            selectedIds[type]!.map(id => fetchItem(config.collectionName!, id))
        );

        onClusterChange({
            ...editedCluster,
            [type]: newRefs
        });

        setActiveDialog(null);
    };

    const handleDelete = (type: keyof References, index: number) => {
        const newRefs = [...(editedCluster[type] || [])];
        newRefs.splice(index, 1);

        onClusterChange({
            ...editedCluster,
            [type]: newRefs
        });
    };

    const renderReferenceChips = (config: typeof REFERENCE_CONFIG[number], references: any[]) => {
        return references.map((reference, index) => (
            <ReferenceChip
                key={typeof reference === 'string' ? `string-${index}` : reference._id}
                reference={reference}
                type={config.chipType}
                view={true}
                delete={true}
                onDelete={() => handleDelete(config.key, index)}
            />
        ));
    };

    const renderSelectionDialog = () => {
        if (!activeDialog) return null;

        const config = REFERENCE_CONFIG.find(c => c.key === activeDialog);
        if (!config?.EnhancedView || !config.collectionName) return null;

        const selectedItems = editedCluster[activeDialog] || [];
        const EnhancedViewComponent = config.EnhancedView;

        return (
            <Dialog
                open={true}
                onClose={() => setActiveDialog(null)}
                maxWidth="md"
                fullWidth
            >
                <Box className="p-4">
                    <EnhancedSelect<CollectionType[typeof config.collectionName]>
                        componentType={config.collectionName}
                        EnhancedView={EnhancedViewComponent}
                        selectedItems={selectedItems as any[]}
                        onSelect={(ids) => {
                            setSelectedIds(prev => ({ ...prev, [activeDialog]: ids }));
                            handleSelectionConfirm(activeDialog);
                        }}
                        isInteractable={true}
                        multiple={true}
                        label={`Select ${config.title}`}
                        activeAccordion={null}
                        onAccordionToggle={() => {}}
                        accordionEntityName={config.key}
                    />
                </Box>
            </Dialog>
        );
    };

    const renderSection = (config: typeof REFERENCE_CONFIG[number]) => {
        const references = editedCluster[config.key] || [];
        const showSection = references.length > 0 

        if (!showSection) return null;

        return (
            <Box key={config.key} className="space-y-2 mb-4">
                <Box className="flex items-center justify-between">
                    <Typography variant="subtitle1" className="font-medium">
                        {config.title}
                    </Typography>
                    {config.collectionName && (
                        <IconButton 
                            size="small" 
                            onClick={() => handleAddClick(config.key)}
                            className="bg-white/50 hover:bg-white/75"
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                <Box className="flex flex-wrap gap-2">
                    {renderReferenceChips(config, references)}
                </Box>
            </Box>
        );
    };

    return (
        <Box className="space-y-4">
            {REFERENCE_CONFIG.map(renderSection)}
            {renderSelectionDialog()}
        </Box>
    );
};

export default DataClusterEditingView;