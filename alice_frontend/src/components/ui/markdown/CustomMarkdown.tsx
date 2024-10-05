import React from 'react';
import Markdown from 'react-markdown';
import { CodeBlock } from './CodeBlock';

interface CustomMarkdownProps {
  className?: string;
  children: string;
}

const CustomMarkdown: React.FC<CustomMarkdownProps> = ({ className, children }) => {
  return (
    <Markdown
      className={className}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');

          return !inline && match ? (
            <CodeBlock language={match[1]} code={children} props={props}/>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          ); 
        },
      }}
    >
      {children}
    </Markdown>
  );
};

export default CustomMarkdown;