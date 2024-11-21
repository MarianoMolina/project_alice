import React from 'react';
import Markdown, { Components } from 'react-markdown';
import {
  Typography,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import useStyles from './MarkdownStyles';
import { CodeBlock } from './CodeBlock';

export interface CustomMarkdownProps {
  className?: string;
  children: string;
}

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ className, children }) => {
  const classes = useStyles();

  const components: Components = {
    h1: ({ node, ...props }) => <Typography className={classes.h1} component="h1" variant="h1" {...props} />,
    h2: ({ node, ...props }) => <Typography className={classes.h2} component="h2" variant="h2" {...props} />,
    h3: ({ node, ...props }) => <Typography className={classes.h3} component="h3" variant="h3" {...props} />,
    h4: ({ node, ...props }) => <Typography className={classes.h4} component="h4" variant="h4" {...props} />,
    h5: ({ node, ...props }) => <Typography className={classes.h5} component="h5" variant="h5" {...props} />,
    h6: ({ node, ...props }) => <Typography className={classes.h6} component="h6" variant="h6" {...props} />,
    p: ({ node, ...props }) => <Typography paragraph className={classes.markdownText} {...props} />,
    a: ({ href, ...props }) => (
      <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <Typography
        component="ol"
        className={classes.markdownText}
        style={{
          listStyleType: 'decimal',
          paddingLeft: '2rem',
          marginBottom: '1rem'
        }}
        {...props}
      />
    ),
    
    ul: ({ node, ...props }) => (
      <Typography
        component="ul"
        className={classes.markdownText}
        style={{
          listStyleType: 'disc',
          paddingLeft: '2rem',
          marginBottom: '1rem'
        }}
        {...props}
      />
    ),
    
    li: ({ node, ...props }) => (
      <Typography
        component="li"
        className={classes.markdownText}
        {...props}
      />
    ),
    hr: ({ node, ...props }) => <Divider className={classes.hr} {...props} />,
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <Typography
            component="span"
            className={classes.inlineVariable}
            style={{ fontStyle: 'italic' }}
            {...props}
          >
            {children}
          </Typography>
        );
      }
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]} code={String(children)} {...props} />
      ) : (
        <CodeBlock language="" code={String(children)} {...props} />
      );
    },
  };

  return (
    <Markdown className={className} components={components}>
      {children}
    </Markdown>
  );
};

export default CustomMarkdown;
