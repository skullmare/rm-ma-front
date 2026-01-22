// MarkdownMessage.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from '../css/modules/ChatPage.module.css';

const MarkdownMessage = ({ content }) => {
  return (
    // УБРАТЬ className у ReactMarkdown и обернуть в div
    <div className={styles.markdownContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className={styles.markdownH1}>{props.children}</h1>,
          h2: (props) => <h2 className={styles.markdownH2}>{props.children}</h2>,
          h3: (props) => <h3 className={styles.markdownH3}>{props.children}</h3>,
          h4: (props) => <h4 className={styles.markdownH4}>{props.children}</h4>,
          p: (props) => <p className={styles.markdownP}>{props.children}</p>,
          ul: (props) => <ul className={styles.markdownUl}>{props.children}</ul>,
          ol: (props) => <ol className={styles.markdownOl}>{props.children}</ol>,
          li: (props) => <li className={styles.markdownLi}>{props.children}</li>,
          table: (props) => (
            <div className={styles.tableWrapper}>
              <table className={styles.markdownTable}>{props.children}</table>
            </div>
          ),
          th: (props) => <th className={styles.markdownTh}>{props.children}</th>,
          td: (props) => <td className={styles.markdownTd}>{props.children}</td>,
          blockquote: (props) => (
            <blockquote className={styles.markdownBlockquote}>{props.children}</blockquote>
          ),
          hr: (props) => <hr className={styles.markdownHr} />,
          a: (props) => (
            <a
              href={props.href}
              className={styles.markdownLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.children}
            </a>
          ),
          strong: (props) => <strong className={styles.markdownStrong}>{props.children}</strong>,
          em: (props) => <em className={styles.markdownEm}>{props.children}</em>,
          code(props) {
            const { node, inline, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');

            if (inline) {
              return <code className={styles.inlineCode} {...rest}>{children}</code>;
            }

            return (
              <div className={styles.codeBlock}>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  {...rest}
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