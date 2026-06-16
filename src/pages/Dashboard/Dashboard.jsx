import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients } from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import { getAppointments } from '../../services/appointmentService';
import { getRecentActivities } from '../../services/activityService';
import StatsCards from '../../components/dashboard/StatsCards';
import Charts from '../../components/dashboard/Charts';
import RecentActivities from '../../components/dashboard/RecentActivities';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    archivedPatients: 0,
    sessionsThisMonth: 0,
    sessionsThisYear: 0,
    nextAppointments: []
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const patients = await getPatients(user.uid);
        const active = patients.filter(p => p.status === 'active');
        const archived = patients.filter(p => p.status === 'archived');
        
        const allSessions = [];
        for (const patient of active) {
          const sessions = await getSessionsByPatient(patient.id, user.uid);
          allSessions.push(...sessions);
        }
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        
        const sessionsThisMonth = allSessions.filter(s => s.date?.toDate() >= monthStart);
        const sessionsThisYear = allSessions.filter(s => s.date?.toDate() >= yearStart);
        
        const appointments = await getAppointments(user.uid, new Date());
        const nextAppointments = appointments.filter(a => a.status === 'scheduled').slice(0, 5);
        
        setStats({
          totalPatients: patients.length,
          activePatients: active.length,
          archivedPatients: archived.length,
          sessionsThisMonth: sessionsThisMonth.length,
          sessionsThisYear: sessionsThisYear.length,
          nextAppointments
        });
        
        const recentActivities = await getRecentActivities(user.uid, 10);
        setActivities(recentActivities);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [user]);

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Dashboard</h1>
      <StatsCards stats={stats} />
      <div style={{ marginTop: '2rem' }}>
        <Charts />
      </div>
      <div style={{ marginTop: '2rem' }}>
        <RecentActivities activities={activities} />
      </div>
    </div>
  );
}
