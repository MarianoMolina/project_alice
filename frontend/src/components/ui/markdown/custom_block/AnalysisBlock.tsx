import { Box, Typography } from "@mui/material";
import React from "react";
import { DialogWrapper } from "./DialogWrapper";
import CustomMarkdown from "../CustomMarkdown";
import { getNodeContent } from "./CustomBlockUtils";

export const AnalysisBlockComponent: React.FC<{ node: any }> = ({ node }) => {
    const [open, setOpen] = React.useState(false);
    const content = getNodeContent(node);
    const title = 'Analysis';

    return (
      <>
        <Box
          onClick={() => setOpen(true)}
          className="cursor-pointer p-4 border rounded-md hover:bg-gray-50 transition-colors"
        >
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Click to view analysis
          </Typography>
        </Box>

        <DialogWrapper open={open} onClose={() => setOpen(false)} title={title}>
          <CustomMarkdown>{content}</CustomMarkdown>
        </DialogWrapper>
      </>
    );
  };