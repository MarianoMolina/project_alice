import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatAlice from './pages/ChatAlice';
import MainLayout from './layouts/MainLayout';
import AliceTools from './pages/AliceTools';
import CreateWorkflow from './pages/CreateWorkflow';
import Database from './pages/Database';

const App: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat-alice" element={<ChatAlice />} />
          <Route path="/alice-tools" element={<AliceTools />} />
          <Route path="/start-workflow" element={<CreateWorkflow />} />
          <Route path="/database" element={<Database />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;