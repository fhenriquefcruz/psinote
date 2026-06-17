import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatients } from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import { getAppointments } from '../../services/appointmentService';
import { getRecentActivities } from '../../services/activityService';
import StatsCards from '../../components/dashboard/StatsCards';
import Charts from '../../components/dashboard/Charts';
import RecentActivities from '../../components/dashboard/RecentActivities';

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  return null;
};

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
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Pacientes
        const patients = await getPatients(user.uid);
        const active = patients.filter(p => p.status === 'active');
        const archived = patients.filter(p => p.status === 'archived');

        // 2. Sessões
        let allSessions = [];
        for (const patient of active) {
          const sessions = await getSessionsByPatient(patient.id, user.uid);
          allSessions = allSessions.concat(sessions);
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const sessionsThisMonth = allSessions.filter(s => {
          const d = parseDate(s.date);
          return d && d >= monthStart;
        });
        const sessionsThisYear = allSessions.filter(s => {
          const d = parseDate(s.date);
          return d && d >= yearStart;
        });

        // 3. Próximas consultas (busca todas, filtra por hoje em diante)
        let allAppointments = [];
        try {
          allAppointments = await getAppointments(user.uid);
        } catch (err) {
          console.warn('Erro ao buscar consultas (índice pendente):', err);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextAppointments = allAppointments
          .filter(a => {
            const d = parseDate(a.date);
            return d && d >= today && (a.status === 'scheduled' || a.status === 'confirmed');
          })
          .sort((a, b) => parseDate(a.date) - parseDate(b.date))
          .slice(0, 5);

        setStats({
          totalPatients: patients.length,
          activePatients: active.length,
          archivedPatients: archived.length,
          sessionsThisMonth: sessionsThisMonth.length,
          sessionsThisYear: sessionsThisYear.length,
          nextAppointments
        });

        // 4. Gráfico de humor
        const moodTrend = allSessions
          .filter(s => s.scales?.mood !== undefined)
          .sort((a, b) => {
            const da = parseDate(a.date);
            const db = parseDate(b.date);
            return da - db;
          })
          .slice(-10)
          .map(s => {
            const d = parseDate(s.date);
            return {
              date: d ? d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }) : '',
              humor: s.scales?.mood || 0
            };
          });
        setMoodData(moodTrend);

        // 5. Atividades (com tratamento de erro)
        try {
          const recentActivities = await getRecentActivities(user.uid, 10);
          setActivities(recentActivities);
          setActivitiesError(false);
        } catch (err) {
          console.warn('Erro ao buscar atividades (índice pendente):', err);
          setActivitiesError(true);
          setActivities([]);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando dashboard...</div>;
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Visão geral da sua prática clínica</p>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
          Online
        </div>
      </div>

      <StatsCards stats={stats} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📈 Evolução do Humor</h3>
          {moodData.length > 0 ? <Charts data={moodData} /> : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Nenhum dado de humor registrado</p>}
        </div>
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>📅 Próximas Consultas</h3>
          {stats.nextAppointments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>Nenhuma consulta agendada</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {stats.nextAppointments.map((a, index) => {
                const d = parseDate(a.date);
                return (
                  <li key={a.id} style={{ padding: '0.6rem 0', borderBottom: index < stats.nextAppointments.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.patientName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d ? d.toLocaleDateString('pt-BR') : 'Data inválida'} • {a.time}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {activitiesError && (
          <div style={{ background: '#FEF3C7', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', color: '#78350F', fontSize: '0.875rem' }}>
            ⚠️ Não foi possível carregar atividades recentes. Verifique se o índice do Firestore foi criado.
          </div>
        )}
        <RecentActivities activities={activities} />
      </div>
    </div>
  );
}
