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
          h1(props) {
            return <h1 className={styles.markdownH1}>{props.children}</h1>;
          },
          h2(props) {
            return <h2 className={styles.markdownH2}>{props.children}</h2>;
          },
          h3(props) {
            return <h3 className={styles.markdownH3}>{props.children}</h3>;
          },
          h4(props) {
            return <h4 className={styles.markdownH4}>{props.children}</h4>;
          },
          p(props) {
            return <p className={styles.markdownP}>{props.children}</p>;
          },
          ul(props) {
            return <ul className={styles.markdownUl}>{props.children}</ul>;
          },
          ol(props) {
            return <ol className={styles.markdownOl}>{props.children}</ol>;
          },
          li(props) {
            return <li className={styles.markdownLi}>{props.children}</li>;
          },
          table(props) {
            return (
              <div className={styles.tableWrapper}>
                <table className={styles.markdownTable}>{props.children}</table>
              </div>
            );
          },
          th(props) {
            return <th className={styles.markdownTh}>{props.children}</th>;
          },
          td(props) {
            return <td className={styles.markdownTd}>{props.children}</td>;
          },
          blockquote(props) {
            return (
              <blockquote className={styles.markdownBlockquote}>{props.children}</blockquote>
            );
          },
          hr(props) {
            return <hr className={styles.markdownHr} />;
          },
          a(props) {
            return (
              <a
                href={props.href}
                className={styles.markdownLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.children}
              </a>
            );
          },
          strong(props) {
            return <strong className={styles.markdownStrong}>{props.children}</strong>;
          },
          em(props) {
            return <em className={styles.markdownEm}>{props.children}</em>;
          },
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