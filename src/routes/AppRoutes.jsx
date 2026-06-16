import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout/MainLayout';
import AuthLayout from '../layouts/AuthLayout/AuthLayout';

// Páginas públicas
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';

// Páginas privadas
import Dashboard from '../pages/Dashboard/Dashboard';
import Patients from '../pages/Patients/Patients';
import PatientProfile from '../pages/Patients/PatientProfile';
import PatientForm from '../pages/Patients/PatientForm';
import Sessions from '../pages/Sessions/Sessions';
import Agenda from '../pages/Agenda/Agenda';
import Documents from '../pages/Documents/Documents';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/Settings/Settings';

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter basename="/psinote">
      <Routes>
        {/* Rotas públicas (sem autenticação) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Rotas privadas (com autenticação) */}
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          {/* Redirecionamento padrão */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Pacientes */}
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/edit/:id" element={<PatientForm />} />
          <Route path="/patients/:id" element={<PatientProfile />} />

          {/* Sessões */}
          <Route path="/sessions" element={<Sessions />} />
          {/* Futuro: /sessions/new, /sessions/:id/edit, etc. */}

          {/* Agenda */}
          <Route path="/agenda" element={<Agenda />} />

          {/* Documentos */}
          <Route path="/documents" element={<Documents />} />

          {/* Relatórios */}
          <Route path="/reports" element={<Reports />} />

          {/* Configurações */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
