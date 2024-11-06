import { Box, Typography, Divider } from "@mui/material";
import React from "react";
import { DialogWrapper } from "./DialogWrapper";
import { getLanguageFromType, getNodeContent } from "./CustomBlockUtils";
import { CodeBlock } from "../CodeBlock";
import { Article, Description, Code } from "@mui/icons-material";
import AliceMarkdown from "./AliceMarkdown";
import Logger from "../../../../utils/Logger";

const getIconByType = (type: string) => {
  if (type.startsWith('text/plain')) {
    return <Description className="text-gray-600" />;
  }
  if (type.includes('code') || type.includes('javascript') || type.includes('python') || type.includes('typescript')) {
    return <Code className="text-gray-600" />;
  }
  return <Article className="text-gray-600" />;
};

export const AliceDocumentBlockComponent: React.FC<{ node: any }> = ({ node }) => {
  const [open, setOpen] = React.useState(false);
  const content = getNodeContent(node);
  
  const attributes = node.data?.attributes || {};
  const identifier = attributes.identifier || 'Document';
  Logger.debug('AliceDocumentBlockComponent', 'identifier', identifier);
  const type = attributes.type || 'text/plain';
  const title = attributes.title || 'Alice Document';
  
  const contentWithoutTags = content.replace(/<[^>]+>/g, '').trim();
  
  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        className="cursor-pointer border rounded-md hover:bg-gray-50 transition-colors flex items-center h-12 px-4 gap-4"
      >
        <Box className="flex items-center gap-4 flex-1">
          {getIconByType(type)}
          <Divider orientation="vertical" flexItem />
          <Typography variant="body1" className="font-medium">
            {title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" className="text-sm">
          Click to view
        </Typography>
      </Box>

      <DialogWrapper open={open} onClose={() => setOpen(false)} title={title}>
        {type === 'text/plain' ? (
          <AliceMarkdown showCopyButton>{contentWithoutTags}</AliceMarkdown>
        ) : (
          <CodeBlock language={getLanguageFromType(type)} code={contentWithoutTags} />
        )}
      </DialogWrapper>
    </>
  );
};

export default AliceDocumentBlockComponent;