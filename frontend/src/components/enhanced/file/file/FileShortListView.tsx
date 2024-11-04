import React, { useEffect, useState } from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import EnhancedShortListView from '../../common/enhanced_component/ShortListView';
import { bytesToMB } from '../../../../utils/FileUtils';
import { getStringLength, LengthUnit, OutputFormat } from '../../../../utils/CharacterLengthUtil';
import { getFileStringContent } from '../../../../utils/FileUtils';
import { retrieveFile } from '../../../../services/api';

const FileShortListView: React.FC<FileComponentProps> = ({
    items,
    item,
    onInteraction,
    onView,
}) => {
    const [fileContents, setFileContents] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadContents = async () => {
            const contentMap: Record<string, string> = {};
            for (const file of items || []) {
                if (file._id) {
                    try {
                        // First retrieve the file blob
                        const blob = await retrieveFile(file._id);
                        // Then get the string content
                        const content = await getFileStringContent(file, blob);
                        contentMap[file._id] = content;
                    } catch (error) {
                        console.error(`Error loading content for file ${file._id}:`, error);
                    }
                }
            }
            setFileContents(contentMap);
        };

        loadContents();
    }, [items]);

    const getPrimaryText = (file: FileReference) => file.filename;
    
    const getSecondaryText = (file: FileReference) => {
        const content = file._id ? fileContents[file._id] || '' : '';
        return `${file.type} - ${bytesToMB(file.file_size)} - ${getStringLength(content, {
            unit: LengthUnit.CHARACTERS,
            format: OutputFormat.STRING
        })} chars`;
    };

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