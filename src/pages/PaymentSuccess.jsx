import React from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>✅ Оплата прошла успешно!</h1>
        <p style={styles.text}>
          Спасибо за покупку! Ваша подписка на мини-приложение Rocketmind активирована.
        </p>
        <button style={styles.button} onClick={() => navigate("/")}>
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};

// Стили можно перенести в CSS, здесь для простоты inline
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f5f5f5",
  },
  card: {
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    textAlign: "center",
    maxWidth: "500px",
  },
  title: {
    marginBottom: "20px",
    color: "#2d8cf0",
  },
  text: {
    marginBottom: "30px",
    fontSize: "16px",
    color: "#333",
  },
  button: {
    padding: "12px 25px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2d8cf0",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default PaymentSuccess;
