import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AgentsListPage from './pages/AgentsListPage.jsx';
import AgentSergyPage from './pages/AgentSergyPage.jsx';
import AgentNickPage from './pages/AgentNickPage.jsx';
import AgentLidaPage from './pages/AgentLidaPage.jsx';
import AgentMarkPage from './pages/AgentMarkPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import TariffPage from './pages/TariffPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
    <Routes>
      <Route
        path="/"
        element={
          isFirstVisit ? <HomePage /> : <Navigate to="/agents_list" replace />
        }
      />
      <Route path="/agents_list" element={<AgentsListPage />} />
      <Route path="/agent_sergy" element={<AgentSergyPage />} />
      <Route path="/agent_nick" element={<AgentNickPage />} />
      <Route path="/agent_lida" element={<AgentLidaPage />} />
      <Route path="/agent_mark" element={<AgentMarkPage />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tariff"
        element={
          <ProtectedRoute>
            <TariffPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
