import React from 'react';
import Markdown, { Components } from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Link as MuiLink,
  Divider,
  SxProps,
  Theme
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
    Logger.debug(`${componentName} props:`, props);
  };

  const wrapStyles: SxProps<Theme> = {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    hyphens: 'auto'
  };

  const components: Components = {
    h1: ({ node, ...props }) => {
      logProps('h1', props);
      return <Typography sx={wrapStyles} className={classes.h1} component="h1" variant="h1" {...props} />;
    },
    h2: ({ node, ...props }) => {
      logProps('h2', props);
      return <Typography sx={wrapStyles} className={classes.h2} component="h2" variant="h2" {...props} />;
    },
    h3: ({ node, ...props }) => {
      logProps('h3', props);
      return <Typography sx={wrapStyles} className={classes.h3} component="h3" variant="h3" {...props} />;
    },
    h4: ({ node, ...props }) => {
      logProps('h4', props);
      return <Typography sx={wrapStyles} className={classes.h4} component="h4" variant="h4" {...props} />;
    },
    h5: ({ node, ...props }) => {
      logProps('h5', props);
      return <Typography sx={wrapStyles} className={classes.h5} component="h5" variant="h5" {...props} />;
    },
    h6: ({ node, ...props }) => {
      logProps('h6', props);
      return <Typography sx={wrapStyles} className={classes.h6} component="h6" variant="h6" {...props} />;
    },
    p: ({ node, ...props }) => {
      return <Typography sx={wrapStyles} paragraph className={classes.markdownText} {...props} />;
    },
    a: ({ href, children, ...props }) => {
      logProps('a', { href, ...props });
      
      const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        
        if (!href) return;

        if (href.startsWith('/shared/knowledgebase')) {
          const cleanPath = href.replace(/\.md$/, '');
          navigate(cleanPath);
        } else if (href.startsWith('http://') || href.startsWith('https://')) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          navigate(href);
        }
      };

      return (
        <MuiLink
          onClick={handleClick}
          sx={wrapStyles}
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
          sx={{
            ...wrapStyles,
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
          sx={{
            ...wrapStyles,
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
          sx={wrapStyles}
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
            sx={{ ...wrapStyles, fontStyle: 'italic' }}
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