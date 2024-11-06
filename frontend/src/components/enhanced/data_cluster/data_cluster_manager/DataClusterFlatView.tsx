import { memo } from 'react';
import { Box } from '@mui/material';
import { DataCluster } from '../../../../types/DataClusterTypes';
import { hasAnyReferences, References } from '../../../../types/ReferenceTypes';
import { CollectionElementString } from '../../../../types/CollectionTypes';
import ReferenceChip from '../../common/references/ReferenceChip';
import { REFERENCE_CONFIG } from './DataClusterManagerTypes';

interface FlatReferenceViewProps {
    editedCluster: DataCluster | undefined;
    onDelete: (type: keyof References, index: number) => void;
    isEditable: boolean;
}

const FlatReferenceView = memo(({
    editedCluster,
    onDelete,
    isEditable
}: FlatReferenceViewProps) => {
    const renderReferenceChip = (
        reference: NonNullable<References[keyof References]>[number], 
        index: number, 
        type: keyof References, 
        chipType: CollectionElementString | 'string_output'
    ) => {
        if (typeof reference === 'string') {
            return (
                <ReferenceChip
                    key={`${type}-${index}`}
                    reference={reference}
                    type="string_output"
                    view={true}
                    delete={false}
                    onDelete={() => onDelete(type, index)}
                />
            );
        }

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

    if (!editedCluster || !hasAnyReferences(editedCluster)) {
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