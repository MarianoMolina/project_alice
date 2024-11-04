import React from 'react';
import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkCustomBlocks from './custom_block/CustomBlock';
import {
  Typography,
  Link as MuiLink,
  Divider,
} from '@mui/material';
import useStyles from './MarkdownStyles';
import { PluggableList } from 'unified';
import { CodeBlock } from './CodeBlock';
import { BlockDefinitions, CustomMarkdownProps } from './CustomMarkdownTypes';
import { AnalysisBlockComponent } from './custom_block/AnalysisBlock';
import { AliceDocumentBlockComponent } from './custom_block/AliceDocumentBlock';

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
    ol: ({ node, ordered, ...props }) => (
      <Typography
        component="ol"
        className={classes.markdownText}
        style={{ listStyleType: ordered ? 'decimal' : 'disc', paddingLeft: '1rem' }}
        {...props}
      />
    ),
    ul: ({ node, ordered, ...props }) => (
      <Typography
        component="ul"
        className={classes.markdownText}
        style={{ listStyleType: ordered ? 'decimal' : 'disc', paddingLeft: '1rem' }}
        {...props}
      />
    ),
    li: ({ node, ...props }) => (
      <Typography component="li" className={classes.markdownText} style={{ paddingLeft: '1rem' }} {...props} />
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
    div: ({ node, className, children, ...props }) => {
      if (className === 'custom-block custom-block-analysis') {
        return <AnalysisBlockComponent node={node} {...props} />;
      } else if (className === 'custom-block custom-block-aliceDocument') {
        return <AliceDocumentBlockComponent node={node} {...props} />;
      } else {
        return (
          <div className={className} {...props}>
            {children}
          </div>
        );
      }
    },
  };

  const customBlockConfig: BlockDefinitions = {
    analysis: {
      classes: 'custom-block-analysis',
      containerElement: 'div',
    },
    aliceDocument: {
      classes: 'custom-block-aliceDocument',
      containerElement: 'div',
    },
  };

  const plugins: PluggableList = [
    remarkGfm,
    [remarkCustomBlocks, customBlockConfig],
  ];

  return (
    <Markdown className={className} remarkPlugins={plugins} components={components}>
      {children}
    </Markdown>
  );
};

export default CustomMarkdown;
