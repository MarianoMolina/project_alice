import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './Theme';
import HomePage from './pages/HomePage';
import ChatAlice from './pages/ChatAlice';
import MainLayout from './layouts/main_layout/MainLayout';
import CreateWorkflow from './pages/StartTask';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './layouts/ProtectedRoute';
import Database from './pages/Database';
import UserSettings from './pages/UserSettings';
import './assets/fonts/fonts.css';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chat-alice" element={<ProtectedRoute element={<ChatAlice />} />} />
          <Route path="/start-task" element={<ProtectedRoute element={<CreateWorkflow />} />} />
          <Route path="/database" element={<ProtectedRoute element={<Database />} />} />
          <Route path="/user-settings" element={<ProtectedRoute element={<UserSettings />} />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
};

export default App;