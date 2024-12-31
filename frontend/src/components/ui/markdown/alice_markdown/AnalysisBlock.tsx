import { Box, Typography, Divider, Paper } from "@mui/material";
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
      <Paper
        onClick={() => setOpen(true)}
        className="cursor-pointer border rounded-md transition-colors flex items-center h-12 px-4 gap-4 w-fit my-2 hover:-translate-y-1 hover:bg-slate-800"
      >
        <Box className="flex items-center gap-4 flex-1">
          <Psychology/>
          <Divider orientation="vertical" flexItem />
          <Typography variant="caption" className="font-medium">
            {title}
          </Typography>
        </Box>
      </Paper>

      <DialogWrapper open={open} onClose={() => setOpen(false)} title={title}>
        <AliceMarkdown showCopyButton>{content}</AliceMarkdown>
      </DialogWrapper>
    </>
  );
};

export default AnalysisBlockComponent;