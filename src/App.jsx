import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    const visited = localStorage.getItem('visited');
    if (!visited) {
      // первый визит
      setIsFirstVisit(true);
      localStorage.setItem('visited', 'true');
    }
    setFirstVisitChecked(true);
  }, []);

  if (!firstVisitChecked) {
    return null; // или лоадер, пока проверяем localStorage
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
