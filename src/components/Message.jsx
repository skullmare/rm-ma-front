// Message.jsx
import React from 'react';
import MarkdownMessage from './MarkdownMessage';
import styles from '../css/modules/ChatPage.module.css';

const Message = ({ msg }) => {
  return (
    <div
      key={msg.id}
      className={`${styles.message} ${msg.type === 'incoming' ? styles.incoming : styles.outgoing}`}
    >
      {msg.type === 'incoming' ? (
        <MarkdownMessage content={msg.text} />
      ) : (
        <div>{msg.text}</div>
      )}
      {/* <div className={styles.messageTime}>{msg.time}</div> */}
    </div>
  );
};

export default Message;