import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PERMISSIONS } from './auth/permissions';
import Layout from './components/Layout';
import AccessDenied from './components/AccessDenied';
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

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user, loading, can } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredPermission && !can(requiredPermission)) {
    return (
      <Layout>
        <AccessDenied permission={requiredPermission} />
      </Layout>
    );
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute requiredPermission={PERMISSIONS.DASHBOARD_READ}><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute requiredPermission={PERMISSIONS.CUSTOMERS_READ}><Customers /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_READ}><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute requiredPermission={PERMISSIONS.ORDERS_READ}><OrderDetail /></ProtectedRoute>} />
          <Route path="/machines" element={<ProtectedRoute requiredPermission={PERMISSIONS.MACHINES_READ}><Machines /></ProtectedRoute>} />
          <Route path="/machines/:id" element={<ProtectedRoute requiredPermission={PERMISSIONS.MACHINES_READ}><MachineDetail /></ProtectedRoute>} />
          <Route path="/service-calls" element={<ProtectedRoute requiredPermission={PERMISSIONS.SERVICE_CALLS_READ}><ServiceCalls /></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute requiredPermission={PERMISSIONS.KNOWLEDGE_BASE_READ}><KnowledgeBase /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute requiredPermission={PERMISSIONS.PROFILE_READ}><UserProfile /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
