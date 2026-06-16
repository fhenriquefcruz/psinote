import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout/MainLayout';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';
import PatientForm from '../pages/Patients/PatientForm';

// Páginas públicas
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';

// Páginas privadas
import Dashboard from '../pages/Dashboard/Dashboard';
import Patients from '../pages/Patients/Patients';
import PatientProfile from '../pages/Patients/PatientProfile';
import Sessions from '../pages/Sessions/Sessions';
import Agenda from '../pages/Agenda/Agenda';
import Documents from '../pages/Documents/Documents';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/Settings/Settings';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/psinote">
      <Routes>
        {/* Rotas públicas */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Rotas privadas */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/patients/new" element={<PatientForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
