import React from 'react';
import Markdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import gfm from 'remark-gfm';
import { Typography, Link as MuiLink } from '@mui/material';
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
        h1: ({ node, ...props }) => <Typography className={classes.h1} variant="h1" {...props} />,
        h2: ({ node, ...props }) => <Typography className={classes.h2} variant="h2" {...props} />,
        h3: ({ node, ...props }) => <Typography className={classes.h3} variant="h3" {...props} />,
        h4: ({ node, ...props }) => <Typography className={classes.h4} variant="h4" {...props} />,
        h5: ({ node, ...props }) => <Typography className={classes.h5} variant="h5" {...props} />,
        h6: ({ node, ...props }) => <Typography className={classes.h6} variant="h6" {...props} />,
        p: ({ node, ...props }) => <Typography paragraph className={classes.markdownText} {...props} />,
        a: ({ node, href, ...props }) => (
          <MuiLink href={href} target="_blank" rel="noopener noreferrer" {...props} />
        ),
        ol: ({ node, ordered, ...props }) => (
          <Typography component="ol" className={classes.markdownText} 
          style={{ listStyleType: ordered ? 'decimal' : 'disc' , paddingLeft: '1rem'}}
          {...props} />
        ),
        ul: ({ node, ordered, ...props }) => (
          <Typography component="ul" className={classes.markdownText} 
          style={{ listStyleType: ordered ? 'decimal' : 'disc' , paddingLeft: '1rem'}}
          {...props} />
        ),
        li: ({ node, ordered, ...props }) => (
          <Typography 
            component="li" 
            className={classes.markdownText}
            style={{ listStyleType: ordered ? 'decimal' : 'disc' , paddingLeft: '1rem'}}
            {...props} 
          />
        ),
        code({ node, inline, className, children, ...props }: any) {
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