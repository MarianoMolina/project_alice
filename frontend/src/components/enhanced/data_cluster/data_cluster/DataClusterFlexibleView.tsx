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

    if (!form) {
        return <Typography>No DataCluster data available.</Typography>;
    }

    const isEditMode = mode === 'edit' || mode === 'create';
    const title = mode === 'create' ? 'Create New DataCluster' : mode === 'edit' ? 'Edit DataCluster' : 'DataCluster Details';
    const saveButtonText = form._id ? 'Update DataCluster' : 'Create DataCluster';

    return (
        <GenericFlexibleView
            elementType="Data Cluster"
            title={title}
            onSave={handleLocalSave}
            onDelete={handleLocalDelete}
            saveButtonText={saveButtonText}
            isEditMode={isEditMode}
            item={item as DataCluster}
            itemType="dataclusters"
        >
            <DataClusterManager
                dataCluster={form}
                isEditable={isEditMode}
                onDataClusterChange={(dataCluster)=>setForm(prevForm => ({ ...prevForm, ...dataCluster }))}
                showCreate={mode !== 'create'}
                showSelect={false}
            />
        </GenericFlexibleView>
    );
};

export default DataClusterFlexibleView;