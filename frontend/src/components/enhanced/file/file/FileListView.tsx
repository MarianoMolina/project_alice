import React, { useEffect, useState } from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { getFileSize } from '../../../../utils/FileUtils';
import { getStringLength, LengthUnit, OutputFormat } from '../../../../utils/CharacterLengthUtil';
import { getFileStringContent } from '../../../../utils/FileUtils';
import { retrieveFile } from '../../../../services/api';
import Logger from '../../../../utils/Logger';

const FileListView: React.FC<FileComponentProps> = ({
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
                        
                        Logger.info('Got content for:', file.filename);
                        Logger.info('Content length:', content.length);
                        Logger.info('Content preview:', content.substring(0, 100));
                        
                        contentMap[file._id] = content;
                    } catch (error) {
                        Logger.error(`Error loading content for file ${file._id}:`, error);
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
        return (
            <Typography component="span" variant="body2" color="textSecondary">
                Type: {file.type}, Size: {getFileSize(file.file_size).formatted}, 
                Length: {getStringLength(content, {
                    unit: LengthUnit.CHARACTERS,
                    format: OutputFormat.STRING
                })} chars
            </Typography>
        );
    };
    
    return (
        <EnhancedListView<FileReference>
            items={items as FileReference[]}
            item={item as FileReference}
            getPrimaryText={getPrimaryText}
            getSecondaryText={getSecondaryText}
            onView={onView}
            onInteraction={onInteraction}
            interactionTooltip="Select File"
            viewTooltip="View File Details"
            collectionElementString='File'
        />
    );
};

export default FileListView;