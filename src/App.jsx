import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Machines from './pages/Machines';
import MachineDetail from './pages/MachineDetail';
import ServiceCalls from './pages/ServiceCalls';
import UserProfile from './pages/UserProfile';
import KnowledgeBase from './pages/KnowledgeBase';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Basic mock bypass if no config exists (for demo running without keys)
  if (!loading && !user && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
     return <Layout>{children}</Layout>;
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/machines" element={<ProtectedRoute><Machines /></ProtectedRoute>} />
          <Route path="/machines/:id" element={<ProtectedRoute><MachineDetail /></ProtectedRoute>} />
          <Route path="/service-calls" element={<ProtectedRoute><ServiceCalls /></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
