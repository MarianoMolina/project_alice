import React, { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { References } from '../../../../types/ReferenceTypes';
import DataClusterHeader from './DataClusterHeader';
import FlatReferenceView from './DataClusterFlatView';
import CategorizedReferenceView from './DataClusterCategorizedView';
import DataClusterEditingView from './DataClusterEditingView';
import { DataClusterManagerProps } from './DataClusterManagerTypes';
import Logger from '../../../../utils/Logger';

const DataClusterManager: React.FC<DataClusterManagerProps> = ({
    dataCluster,
    onDataClusterChange,
    isEditable = false,
    showEdit = true,
    showSelect = true,
    flatten = true,
    title = 'Data Cluster'
}) => {
    const [inEditMode, setInEditMode] = useState(false);
    const [editedCluster, setEditedCluster] = useState<DataCluster | undefined>(dataCluster);
    const [isFlatView, setIsFlatView] = useState(flatten);

    Logger.debug('[DataClusterManager]', 'dataCluster', dataCluster);

    const toggleEdit = useCallback(() => {
        if (dataCluster) {
            setInEditMode && setInEditMode(prev => !prev);
        }
    }, [dataCluster]);

    const handleClusterChange = useCallback((newCluster: DataCluster) => {
        setEditedCluster(newCluster);
        onDataClusterChange && onDataClusterChange(newCluster);
    }, [onDataClusterChange]);

    const localOnDataClusterChange = useCallback((newCluster: DataCluster | undefined) => {
        handleClusterChange(newCluster || {});
    }, [handleClusterChange]);

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
        onDataClusterChange && onDataClusterChange(editedCluster);
    }, [editedCluster, isEditable, onDataClusterChange]);

    const renderContent = () => {
        if (inEditMode && editedCluster) {
            return (
                <DataClusterEditingView
                    editedCluster={editedCluster}
                    onClusterChange={handleClusterChange}
                />
            );
        }

        return (
            <Box className="pr-12">
                {isFlatView ? (
                    <FlatReferenceView
                        editedCluster={editedCluster}
                        onDelete={handleDelete}
                        isEditable={isEditable}
                    />
                ) : (
                    <CategorizedReferenceView
                        editedCluster={editedCluster}
                        onDelete={handleDelete}
                        isEditable={isEditable}
                    />
                )}
            </Box>
        );
    };

    return (
        <div className="relative p-4 border rounded-lg shadow-sm">
            <Typography variant="h6" className="mb-4">{title}</Typography>
            <DataClusterHeader
                editedCluster={editedCluster}
                isFlatView={isFlatView}
                setIsFlatView={setIsFlatView}
                isEditable={isEditable}
                showEdit={showEdit}
                showSelect={showSelect}
                onEdit={toggleEdit}
                dataCluster={dataCluster}
                onDataClusterChange={localOnDataClusterChange}
                inEditMode={inEditMode}
            />
            {renderContent()}
        </div>
    );
};

export default DataClusterManager;