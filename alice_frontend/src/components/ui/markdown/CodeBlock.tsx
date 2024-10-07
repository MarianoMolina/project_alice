import React from 'react';
import { Box, Typography } from '@mui/material';
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
      <Box className={classes.CodeBlockHeader}>
        <Box className={classes.HeaderContent}>
          {language && (
            <Typography variant="caption" className={classes.LanguageTag}>
              {language}
            </Typography>
          )}
          <CopyButton code={code} />
        </Box>
      </Box>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="pre"
        CodeTag="code"
        showLineNumbers={true}
        wrapLines={true}
        customStyle={{
          margin: 0,
          padding: '1em',
          borderRadius: '5px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'auto',
        }}
        codeTagProps={{
          style: {
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            display: 'inline-block',
            width: '100%',
          }
        }}
        lineProps={{
          style: {
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }
        }}
        {...props}
      >
        {String(code).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </Box>
  );
};