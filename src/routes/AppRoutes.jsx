import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout/MainLayout';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';

import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import Dashboard from '../pages/Dashboard/Dashboard';
import Patients from '../pages/Patients/Patients';
import PatientProfile from '../pages/Patients/PatientProfile';
import PatientForm from '../pages/Patients/PatientForm';
import Sessions from '../pages/Sessions/Sessions';
import Agenda from '../pages/Agenda/Agenda';
import Documents from '../pages/Documents/Documents';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/Settings/Settings';
import Admin from '../pages/Admin/Admin';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/psinote">
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/edit/:id" element={<PatientForm />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/documents/generate/:patientId" element={<DocumentGeneratorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
