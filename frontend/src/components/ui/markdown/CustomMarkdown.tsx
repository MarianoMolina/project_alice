import React from 'react';
import Markdown, { Components } from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import useStyles from './MarkdownStyles';
import { CodeBlock } from './CodeBlock';
import Logger from '../../../utils/Logger';

export interface CustomMarkdownProps {
  className?: string;
  children: string;
}

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ className, children }) => {
  const classes = useStyles();
  const navigate = useNavigate();

  const logProps = (componentName: string, props: any) => {
    Logger.info(`${componentName} props:`, props);
  };

  const components: Components = {
    h1: ({ node, ...props }) => {
      logProps('h1', props);
      return <Typography className={classes.h1} component="h1" variant="h1" {...props} />;
    },
    h2: ({ node, ...props }) => {
      logProps('h2', props);
      return <Typography className={classes.h2} component="h2" variant="h2" {...props} />;
    },
    h3: ({ node, ...props }) => {
      logProps('h3', props);
      return <Typography className={classes.h3} component="h3" variant="h3" {...props} />;
    },
    h4: ({ node, ...props }) => {
      logProps('h4', props);
      return <Typography className={classes.h4} component="h4" variant="h4" {...props} />;
    },
    h5: ({ node, ...props }) => {
      logProps('h5', props);
      return <Typography className={classes.h5} component="h5" variant="h5" {...props} />;
    },
    h6: ({ node, ...props }) => {
      logProps('h6', props);
      return <Typography className={classes.h6} component="h6" variant="h6" {...props} />;
    },
    p: ({ node, ...props }) => {
      return <Typography paragraph className={classes.markdownText} {...props} />;
    },
    a: ({ href, children, ...props }) => {
      logProps('a', { href, ...props });
      
      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        
        if (!href) return;

        // Handle internal knowledgebase links
        if (href.startsWith('/shared/knowledgebase')) {
          const cleanPath = href.replace(/\.md$/, '');
          navigate(cleanPath);
        } else if (href.startsWith('http://') || href.startsWith('https://')) {
          // External links open in new tab
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          // Other internal links
          navigate(href);
        }
      };

      return (
        <MuiLink
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
          className={classes.link}
          {...props}
        >
          {children}
        </MuiLink>
      );
    },
    ol: ({ node, ...props }) => {
      logProps('ol', props);
      const { ordered, ...restProps } = props;
      return (
        <Typography
          component="ol"
          className={classes.markdownText}
          style={{
            listStyleType: 'decimal',
            paddingLeft: '2rem',
            marginBottom: '1rem'
          }}
          {...restProps}
        />
      );
    },
    ul: ({ node, ...props }) => {
      logProps('ul', props);
      const { ordered, ...restProps } = props;
      return (
        <Typography
          component="ul"
          className={classes.markdownText}
          style={{
            listStyleType: 'disc',
            paddingLeft: '2rem',
            marginBottom: '1rem'
          }}
          {...restProps}
        />
      );
    },
    li: ({ node, ...props }) => {
      logProps('li', props);
      const { ordered, ...restProps } = props;
      return (
        <Typography
          component="li"
          className={classes.markdownText}
          {...restProps}
        />
      );
    },
    hr: ({ node, ...props }) => {
      logProps('hr', props);
      return <Divider className={classes.hr} {...props} />;
    },
    code({ node, inline, className, children, ...props }) {
      logProps('code', { inline, className, ...props });
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