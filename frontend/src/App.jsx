import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Gastos } from './pages/Gastos';
import { Categorias } from './pages/Categorias';
import { Relatorios } from './pages/Relatorios';
import { Alertas } from './pages/Alertas';
import { Insights } from './pages/Insights';
import { AuthService } from './services/api';

const PrivateRoute = ({ children }) => {
  const user = AuthService.loadUser();
  return user ? children : <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Layout title="Dashboard" subtitle="Visão geral das suas finanças" /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="alertas" element={<Alertas />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};
