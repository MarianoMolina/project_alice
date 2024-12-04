import React, { useState, useCallback, useEffect } from 'react';
import {
    Typography,
} from '@mui/material';
import { DataClusterComponentProps, DataCluster, getDefaultDataClusterForm } from '../../../../types/DataClusterTypes';
import GenericFlexibleView from '../../common/enhanced_component/FlexibleView';
import Logger from '../../../../utils/Logger';
import DataClusterManager from '../data_cluster_manager/DataClusterManager';

const DataClusterFlexibleView: React.FC<DataClusterComponentProps> = ({
    item,
    onChange,
    mode,
    handleSave,
    handleDelete
}) => {
    const [form, setForm] = useState<Partial<DataCluster>>(item || getDefaultDataClusterForm());
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New DataCluster' : mode === 'edit' ? 'Edit DataCluster' : 'DataCluster Details';
    const saveButtonText = form._id ? 'Update DataCluster' : 'Create DataCluster';
    
    Logger.debug('DataClusterFlexibleView', 'form', form);

    useEffect(() => {
        if (isSaving) {
            handleSave();
            setIsSaving(false);
        }
    }, [isSaving, handleSave]);
    
    useEffect(() => {
        if (item) {
            setForm(item);
        } else {
            onChange(getDefaultDataClusterForm());
        }
    }, [item, onChange]);

    const handleLocalSave = useCallback(() => {
        onChange(form);
        setIsSaving(true);
    }, [form, onChange]);
    
    const handleLocalDelete = useCallback(() => {
        if (item && Object.keys(item).length > 0 && handleDelete) {
            handleDelete(item);
        }
    }, [item, handleDelete]);

    const handleDataClusterUpdate = useCallback((dataCluster: DataCluster | undefined) => {
        if (!dataCluster || Object.keys(dataCluster).length === 0) {
            return
        }
        setForm(dataCluster);
    }, []);

    if (!form) {
        return <Typography>No DataCluster data available.</Typography>;
    }

    return (
        <GenericFlexibleView
            elementType="Data Cluster"
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            mode={mode}
            item={form as DataCluster}
            itemType="dataclusters"
        >
            <DataClusterManager
                dataCluster={form}
                isEditable={isEditMode}
                onDataClusterChange={handleDataClusterUpdate}
                showCreate={mode !== 'create'}
                showSelect={false}
            />
        </GenericFlexibleView>
    );
};

export default DataClusterFlexibleView;