import React from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { bytesToMB } from '../../../../utils/FileUtils';

const FileShortListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const getPrimaryText = (file: FileReference) => file.filename;
    const getSecondaryText = (file: FileReference) => `${file.type} - ${bytesToMB(file.file_size)}`;

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