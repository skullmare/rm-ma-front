// MarkdownMessage.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from '../css/modules/ChatPage.module.css';

const MarkdownMessage = ({ content }) => {
  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className={styles.markdownH1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.markdownH2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.markdownH3}>{children}</h3>,
          h4: ({ children }) => <h4 className={styles.markdownH4}>{children}</h4>,
          p: ({ children }) => <p className={styles.markdownP}>{children}</p>,
          ul: ({ children }) => <ul className={styles.markdownUl}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.markdownOl}>{children}</ol>,
          li: ({ children }) => <li className={styles.markdownLi}>{children}</li>,
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.markdownTable}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th className={styles.markdownTh}>{children}</th>,
          td: ({ children }) => <td className={styles.markdownTd}>{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className={styles.markdownBlockquote}>{children}</blockquote>
          ),
          hr: () => <hr className={styles.markdownHr} />,
          a: ({ href, children }) => (
            <a 
              href={href} 
              className={styles.markdownLink} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className={styles.markdownStrong}>{children}</strong>,
          em: ({ children }) => <em className={styles.markdownEm}>{children}</em>,
          // ИСПРАВЛЕННЫЙ КОМПОНЕНТ CODE
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');

            if (inline) {
              return <code className={styles.inlineCode}>{children}</code>;
            }

            return (
              <div className={styles.codeBlock}>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;