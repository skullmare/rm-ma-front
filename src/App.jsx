import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Импорты страниц
import HomePage from './pages/HomePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AgentsListPage from './pages/AgentsListPage.jsx';
import AgentDetailPage from './pages/AgentDetailPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import TariffPage from './pages/TariffPage.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';

// Компоненты
import AuthGuard from './components/AuthGuard.jsx';

function App() {
  const [firstVisitChecked, setFirstVisitChecked] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // 1. Логика первого визита (Onboarding)
    const visited = localStorage.getItem('visited');
    if (!visited) {
      setIsFirstVisit(true);
      localStorage.setItem('visited', 'true');
    }

    // 2. Логика Telegram Mini App (Start Parameters)
    // Ожидаем формат ссылки: https://t.me/bot/app?startapp=fromCourse-true_selectedAgent-nick
    const tg = window.Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param;

    if (startParam) {
      try {
        // Парсим строку: "fromCourse-true_selectedAgent-nick" -> {fromCourse: "true", selectedAgent: "nick"}
        const params = Object.fromEntries(
          startParam.split('_').map(pair => {
            const [key, value] = pair.split('-');
            return [key, value];
          })
        );

        const { fromCourse, selectedAgent } = params;

        if (fromCourse === 'true' && selectedAgent) {
          // Сохраняем флаг входа из курса
          localStorage.setItem('fromCourse', 'true');

          // Обновляем список выбранных агентов (накопительно)
          const storedAgents = localStorage.getItem('selectedAgents');
          let agentsArray = storedAgents ? JSON.parse(storedAgents) : [];

          if (!agentsArray.includes(selectedAgent)) {
            agentsArray.push(selectedAgent);
            localStorage.setItem('selectedAgents', JSON.stringify(agentsArray));
          }
          
          console.log(`Агент ${selectedAgent} добавлен из курса`);
        }
      } catch (error) {
        console.error("Ошибка парсинга start_param:", error);
      }
    }

    setFirstVisitChecked(true);
  }, []);

  // Пока проверяем первый визит и параметры, ничего не рендерим
  if (!firstVisitChecked) {
    return null; 
  }

  return (
    <AuthGuard>
      <Routes>
        {/* Главная: если первый раз — лендинг, если нет — сразу к списку */}
        <Route
          path="/"
          element={
            isFirstVisit ? <HomePage /> : <Navigate to="/agents_list" replace />
          }
        />
        
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/agents_list" element={<AgentsListPage />} />
        
        {/* Динамические или статические роуты агентов */}
        <Route path="/agent_sergy" element={<AgentDetailPage />} />
        <Route path="/agent_nick" element={<AgentDetailPage />} />
        <Route path="/agent_lida" element={<AgentDetailPage />} />
        <Route path="/agent_mark" element={<AgentDetailPage />} />
        
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tariff" element={<TariffPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />

        {/* Редирект для несуществующих страниц */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGuard>
  );
}

export default App;