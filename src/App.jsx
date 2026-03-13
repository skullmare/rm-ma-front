import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'; // Добавили useSearchParams
import HomePage from './pages/HomePage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import AgentsListPage from './pages/AgentsListPage.jsx';
import AgentDetailPage from './pages/AgentDetailPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import TariffPage from './pages/TariffPage.jsx';
import AuthGuard from './components/AuthGuard.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';

function App() {
  const [firstVisitChecked, setFirstVisitChecked] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Логика первого визита
    const visited = localStorage.getItem('visited');
    if (!visited) {
      setIsFirstVisit(true);
      localStorage.setItem('visited', 'true');
    }

    // 2. Логика "Вход из курса" (Накопительная)
    const fromCourse = searchParams.get('fromCourse');
    const selectedAgent = searchParams.get('selectedAgent');

    if (fromCourse === 'true' && selectedAgent) {
      localStorage.setItem('fromCourse', 'true');

      // Получаем текущий список из localStorage или создаем пустой массив
      const storedAgents = localStorage.getItem('selectedAgents');
      let agentsArray = storedAgents ? JSON.parse(storedAgents) : [];

      // Добавляем агента, только если его еще нет в списке
      if (!agentsArray.includes(selectedAgent)) {
        agentsArray.push(selectedAgent);
        localStorage.setItem('selectedAgents', JSON.stringify(agentsArray));
      }
    }

    setFirstVisitChecked(true);
  }, [searchParams]);

  if (!firstVisitChecked) {
    return null; 
  }

  return (
    <AuthGuard>
      <Routes>
        <Route
          path="/"
          element={
            isFirstVisit ? <HomePage /> : <Navigate to="/agents_list" replace />
          }
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        
        {/* В AgentsListPage нужно будет прокинуть логику фильтрации */}
        <Route path="/agents_list" element={<AgentsListPage />} />
        
        <Route path="/agent_sergy" element={<AgentDetailPage />} />
        <Route path="/agent_nick" element={<AgentDetailPage />} />
        <Route path="/agent_lida" element={<AgentDetailPage />} />
        <Route path="/agent_mark" element={<AgentDetailPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tariff" element={<TariffPage />} />
      </Routes>
    </AuthGuard>
  );
}

export default App;