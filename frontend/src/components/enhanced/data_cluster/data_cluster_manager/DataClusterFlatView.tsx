import { memo } from 'react';
import { Box } from '@mui/material';
import { PopulatedDataCluster } from '../../../../types/DataClusterTypes';
import { hasAnyReferences, PopulatedReferences, References } from '../../../../types/ReferenceTypes';
import { CollectionElementString } from '../../../../types/CollectionTypes';
import ReferenceChip from '../ReferenceChip';
import { REFERENCE_CONFIG } from './DataClusterManagerTypes';

interface FlatReferenceViewProps {
    editedCluster: PopulatedDataCluster | undefined;
    onDelete: (type: keyof References, index: number) => void;
    isEditable: boolean;
}

const FlatReferenceView = memo(({
    editedCluster,
    onDelete,
}: FlatReferenceViewProps) => {
    const renderReferenceChip = (
        reference: NonNullable<PopulatedReferences[keyof References]>[number], 
        index: number, 
        type: keyof References, 
        chipType: CollectionElementString
        ) => {

        return (
            <ReferenceChip
                key={reference._id || `${type}-${index}`}
                reference={reference}
                type={chipType}
                view={true}
                delete={false}
                onDelete={() => onDelete(type, index)}
            />
        );
    };

    if (!editedCluster || !hasAnyReferences(editedCluster as References)) {
        return <div className="text-gray-500 italic">No references available</div>;
    }

    return (
        <Box className="flex flex-wrap gap-2">
            {REFERENCE_CONFIG.map(({ key, chipType }) => {
                const references = editedCluster[key];
                if (!references || references.length === 0) return null;

                return references.map((reference, index) =>
                    renderReferenceChip(reference, index, key, chipType)
                );
            })}
        </Box>
    );
});

export default FlatReferenceView;