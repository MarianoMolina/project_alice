import React, { useEffect, useState } from 'react';
import { FileReference, FileComponentProps } from '../../../../types/FileTypes';
import { Typography } from '@mui/material';
import EnhancedListView from '../../common/enhanced_component/ListView';
import { bytesToMB } from '../../../../utils/FileUtils';
import { getStringLength, LengthUnit, OutputFormat } from '../../../../utils/CharacterLengthUtil';
import { getFileStringContent } from '../../../../utils/FileUtils';
import { retrieveFile } from '../../../../services/api';

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
                        
                        console.log('Got content for:', file.filename);
                        console.log('Content length:', content.length);
                        console.log('Content preview:', content.substring(0, 100));
                        
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
        return (
            <Typography component="span" variant="body2" color="textSecondary">
                Type: {file.type}, Size: {bytesToMB(file.file_size)}, 
                Length: {getStringLength(content, {
                    unit: LengthUnit.CHARACTERS,
                    format: OutputFormat.STRING
                })} chars
            </Typography>
        );
    };
    
    return (
        <EnhancedListView<FileReference>
            items={items}
            item={item}
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