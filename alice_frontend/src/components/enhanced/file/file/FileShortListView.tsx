import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';

const FileShortListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (file: FileReference) => file.filename;
    const getSecondaryText = (file: FileReference) => `${file.type} - ${file.file_size} bytes`;

    return (
        <EnhancedShortListView<FileReference>
            items={items}
            item={item}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
        />
    );
};

export default FileShortListView;