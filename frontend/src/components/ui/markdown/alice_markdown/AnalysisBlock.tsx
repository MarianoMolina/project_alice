import { Box, Typography, Divider } from "@mui/material";
import React from "react";
import { DialogWrapper } from "./DialogWrapper";
import { getNodeContent } from "./CustomBlockUtils";
import { Psychology } from "@mui/icons-material";
import AliceMarkdown from "./AliceMarkdown";
import Logger from "../../../../utils/Logger";

export const AnalysisBlockComponent: React.FC<{ node: any }> = ({ node }) => {
  const [open, setOpen] = React.useState(false);
  Logger.debug('[Markdown] Rendering Analysis block:', node);
  const content = getNodeContent(node);
  const attributes = node.data?.attributes || {};
  const title = attributes.title || 'Analysis';

  Logger.debug('[Markdown] Analysis block content:', content);

  return (
    <>
      <Box
        onClick={() => setOpen(true)}
        className="cursor-pointer border rounded-md hover:bg-gray-50 transition-colors flex items-center h-12 px-4 gap-4 w-fit my-2"
      >
        <Box className="flex items-center gap-4 flex-1">
          <Psychology className="text-gray-600" />
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
        <AliceMarkdown showCopyButton>{content}</AliceMarkdown>
      </DialogWrapper>
    </>
  );
};

export default AnalysisBlockComponent;