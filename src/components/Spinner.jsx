import React, { useEffect } from 'react';

function Spinner() {
  const spinnerOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '500px',
    height: '100%',
    background: '#121212',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  };

  const spinnerContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const spinnerStyle = {
    width: '50px',
    height: '50px',
    border: '4px solid #3E3E3E',
    borderTop: '4px solid #A172F8',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  // Добавляем keyframes в head, если их еще нет
  useEffect(() => {
    const styleId = 'spinner-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={spinnerOverlayStyle}>
      <div style={spinnerContainerStyle}>
        <div style={spinnerStyle}></div>
      </div>
    </div>
  );
}

export default Spinner;

