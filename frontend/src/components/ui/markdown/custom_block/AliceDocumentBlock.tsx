import { Box, Typography } from "@mui/material";
import React from "react";
import { DialogWrapper } from "./DialogWrapper";
import CustomMarkdown from "../CustomMarkdown";
import { getNodeContent } from "./CustomBlockUtils";
import { CodeBlock } from "../CodeBlock";

const getLanguageFromType = (type: string): string => {
    return type.split('/')[1] || '';
};

export const AliceDocumentBlockComponent: React.FC<{ node: any }> = ({ node }) => {
    const [open, setOpen] = React.useState(false);
    const content = getNodeContent(node);

    // Extract attributes from the node's data
    const attributes = node.data?.attributes || {};
    const identifier = attributes.identifier || 'Document';
    const type = attributes.type || 'text/plain';
    const title = attributes.title || '';

    // Remove the opening and closing tags from content
    const contentWithoutTags = content.replace(/<[^>]+>/g, '').trim();

    return (
        <>
            <Box
                onClick={() => setOpen(true)}
                className="cursor-pointer p-4 border rounded-md hover:bg-gray-50 transition-colors"
            >
                <Typography variant="h6">{title || identifier}</Typography>
                <Typography variant="body2" color="text.secondary">
                    Click to view document
                </Typography>
            </Box>

            <DialogWrapper open={open} onClose={() => setOpen(false)} title={title || identifier}>
                {type === 'text/plain' ? (
                    <CustomMarkdown>{contentWithoutTags}</CustomMarkdown>
                ) : (
                    <CodeBlock language={getLanguageFromType(type)} code={contentWithoutTags} />
                )}
            </DialogWrapper>
        </>
    );
};