import { Box } from '@mui/material';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useStyles from './MarkdownStyles';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  language: string;
  code: string; 
  props?: any;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, props }) => {
  const classes = useStyles();
  return (
    <Box className={classes.CodeBlockClass}>
      <CopyButton code={code} />
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        showLineNumbers={true}
        showInlineLineNumbers={false}
        wrapLines={true}
        customStyle={{
          border: "1px solid #c3c3c3",
          borderRadius: "5px",
        }}
        {...props}>
        {String(code).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </Box>
  );
};