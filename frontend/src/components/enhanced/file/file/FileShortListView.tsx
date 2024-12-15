import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { getFileSize } from '../../../../utils/FileUtils';

const FileShortListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (file: FileReference) => file.filename;
    
    const getSecondaryText = (file: FileReference) => {
        return `${file.type} - ${getFileSize(file.file_size).formatted}`;
    };

    return (
        <EnhancedShortListView<FileReference>
            items={items as FileReference[]}
            item={item as FileReference}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default FileShortListView;