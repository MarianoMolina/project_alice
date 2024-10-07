import React from 'react';
import Markdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import gfm from 'remark-gfm';
import { Typography, Link as MuiLink  } from '@mui/material';
import useStyles from './MarkdownStyles';

interface CustomMarkdownProps {
  className?: string;
  children: string;
}

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ className, children }) => {
  const classes = useStyles();
  return (
    <Markdown
      className={className}
      remarkPlugins={[gfm]}
      components={{
        h1: ({ node, ...props }) => <Typography className={classes.heading} component="h1" {...props} />,
        h2: ({ node, ...props }) => <Typography className={classes.heading} component="h2" {...props} />,
        h3: ({ node, ...props }) => <Typography className={classes.heading} component="h3" {...props} />,
        h4: ({ node, ...props }) => <Typography className={classes.heading} component="h4" {...props} />,
        h5: ({ node, ...props }) => <Typography className={classes.heading} component="h5" {...props} />,
        h6: ({ node, ...props }) => <Typography className={classes.heading} component="h6" {...props} />,
        p: ({ node, ...props }) => <Typography paragraph className={classes.markdownText} {...props} />,
        a: ({ node, href, ...props }) => (
          <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props} />
        ),
        ul: ({ node, ...props }) => <Typography component="ul" className={classes.markdownText} {...props} />,
        ol: ({ node, ...props }) => <Typography component="ol" className={classes.markdownText} {...props} />,
        li: ({ node, ...props }) => <Typography component="li" className={classes.markdownText} {...props} />,
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');

          return !inline && match ? (
            <CodeBlock language={match[1]} code={children} props={props} />
          ) : (
            <CodeBlock language={''} code={children} props={props} />
          );
        },
      }}
    >
      {children}
    </Markdown>
  );
};

export default CustomMarkdown;