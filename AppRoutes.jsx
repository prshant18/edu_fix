
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/auth/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import LandingPage from './components/landing/LandingPage';
import ChilloutPage from './components/chillout/ChilloutPage';
import NotFound from './components/common/NotFound';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard/*"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/chillout"
        element={
          <PrivateRoute>
            <ChilloutPage />
          </PrivateRoute>
        }
      />
      {/* Redirect authenticated users trying to access login/register to dashboard */}
      {isAuthenticated && (
        <>
          <Route path="/login" element={<Navigate to="/dashboard" />} />
          <Route path="/register" element={<Navigate to="/dashboard" />} />
        </>
      )}
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
