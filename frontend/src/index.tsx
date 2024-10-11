import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container!);
const router = createBrowserRouter(createRoutesFromElements(<Route path='*' element={<App />} />));

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);