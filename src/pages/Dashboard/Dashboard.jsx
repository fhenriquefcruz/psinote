import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Plus,
  Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAppointments } from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import { getSessions } from '../../services/sessionService';
import { getRecentActivities } from '../../services/activityService';
import RecentActivities from '../../components/dashboard/RecentActivities';
import styles from './Dashboard.module.css';

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const appointmentMoment = (appointment) => {
  const date = toDate(appointment.date);
  if (!date) return null;

  const result = new Date(date);
  if (appointment.time && /^\d{2}:\d{2}$/.test(appointment.time)) {
    const [hours, minutes] = appointment.time.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  }

  return result;
};

const statusLabel = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  done: 'Realizado',
  canceled: 'Cancelado',
  missed: 'Não compareceu'
};

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const [patientList, appointmentList, sessionList, activityList] = await Promise.all([
          getPatients(user.uid, 'active'),
          getAppointments(user.uid),
          getSessions(user.uid, 40),
          getRecentActivities(user.uid, 8)
        ]);

        setPatients(patientList);
        setAppointments(appointmentList);
        setSessions(sessionList);
        setActivities(activityList);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const todayAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => {
          const date = toDate(appointment.date);
          return date && date >= todayStart && date <= todayEnd;
        })
        .sort((a, b) => (appointmentMoment(a)?.getTime() || 0) - (appointmentMoment(b)?.getTime() || 0)),
    [appointments, todayEnd, todayStart]
  );

  const actionableToday = todayAppointments.filter(
    (appointment) => !['canceled', 'missed'].includes(appointment.status)
  );

  const currentAppointment = actionableToday.find((appointment) => {
    const start = appointmentMoment(appointment);
    if (!start) return false;
    const duration = Number(appointment.duration || 50);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    return now >= start && now <= end;
  });

  const nextAppointment =
    currentAppointment ||
    actionableToday.find((appointment) => {
      const moment = appointmentMoment(appointment);
      return moment && moment >= now && ['scheduled', 'confirmed'].includes(appointment.status);
    });

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pendingRecords = appointments
    .filter((appointment) => {
      const date = toDate(appointment.date);
      return (
        appointment.status === 'done' &&
        !appointment.recordCompletedAt &&
        date &&
        date >= thirtyDaysAgo
      );
    })
    .sort((a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0));

  const draftSessions = sessions.filter((session) => session.status === 'draft');
  const recentFinalized = sessions.filter((session) => session.status === 'finalized').slice(0, 4);

  const patientNames = useMemo(
    () => Object.fromEntries(patients.map((patient) => [patient.id, patient.name])),
    [patients]
  );

  if (loading) {
    return <div className="page-shell">Preparando sua visão do dia...</div>;
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <div className="section-kicker">Hoje</div>
          <h1 className="page-title">
            {userProfile?.name ? 'Bom dia, ' + userProfile.name.split(' ')[0] : 'Visão do dia'}
          </h1>
          <p className="page-subtitle">
            Agenda, registros e próximos passos em um só lugar.
          </p>
        </div>

        <div className={styles.quickActions}>
          <Link className="button button-secondary" to="/patients/new">
            <Users size={17} aria-hidden="true" />
            Novo paciente
          </Link>
          <Link className="button button-primary" to="/sessions/new">
            <Plus size={17} aria-hidden="true" />
            Nova sessão
          </Link>
        </div>
      </header>

      <section className={styles.commandGrid}>
        <div className={'surface ' + styles.nextCard}>
          <div className={styles.cardKicker}>
            {currentAppointment ? 'Em atendimento agora' : 'Próximo atendimento'}
          </div>

          {nextAppointment ? (
            <>
              <div className={styles.nextIdentity}>
                <div>
                  <h2>{nextAppointment.patientName || patientNames[nextAppointment.patientId] || 'Paciente'}</h2>
                  <div className={styles.nextMeta}>
                    <Clock3 size={16} aria-hidden="true" />
                    <span>{nextAppointment.time || 'Horário não informado'}</span>
                    <span>•</span>
                    <span>{nextAppointment.duration || 50} min</span>
                    <span className="badge badge-info">
                      {statusLabel[nextAppointment.status] || nextAppointment.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.nextActions}>
                <Link
                  className="button button-primary"
                  to={'/sessions/new?patientId=' + nextAppointment.patientId + '&appointmentId=' + nextAppointment.id}
                >
                  Abrir registro
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  className="button button-secondary"
                  to={'/patients/' + nextAppointment.patientId}
                >
                  Ver paciente
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.calmState}>
              <CheckCircle2 size={24} aria-hidden="true" />
              <div>
                <strong>Nenhum atendimento pendente para hoje.</strong>
                <p>Você pode revisar registros ou organizar a agenda.</p>
              </div>
            </div>
          )}
        </div>

        <div className={'surface ' + styles.todayCard}>
          <div className={styles.sectionHead}>
            <div>
              <div className="section-kicker">Agenda</div>
              <h2 className="section-title">Hoje</h2>
            </div>
            <Link to="/agenda">Abrir agenda</Link>
          </div>

          <div className={styles.todayList}>
            {todayAppointments.length === 0 ? (
              <div className={styles.smallEmpty}>Nenhum compromisso hoje.</div>
            ) : (
              todayAppointments.slice(0, 5).map((appointment) => (
                <div className={styles.appointmentRow} key={appointment.id}>
                  <div className={styles.time}>{appointment.time || '--:--'}</div>
                  <div className={styles.appointmentInfo}>
                    <strong>
                      {appointment.patientName || patientNames[appointment.patientId] || 'Paciente'}
                    </strong>
                    <span>{statusLabel[appointment.status] || appointment.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={styles.attentionGrid}>
        <div className="surface">
          <div className="surface-header">
            <div>
              <div className="section-kicker">Atenção</div>
              <h2 className="section-title">Registros pendentes</h2>
            </div>
            <span className={pendingRecords.length ? 'badge badge-warning' : 'badge badge-success'}>
              {pendingRecords.length}
            </span>
          </div>

          <div className={styles.actionList}>
            {pendingRecords.length === 0 ? (
              <div className={styles.smallEmpty}>Nenhuma consulta realizada aguardando registro.</div>
            ) : (
              pendingRecords.slice(0, 5).map((appointment) => (
                <div className={styles.actionRow} key={appointment.id}>
                  <div>
                    <strong>
                      {appointment.patientName || patientNames[appointment.patientId] || 'Paciente'}
                    </strong>
                    <span>
                      {toDate(appointment.date)?.toLocaleDateString('pt-BR') || 'Data não informada'}
                    </span>
                  </div>
                  <Link
                    to={'/sessions/new?patientId=' + appointment.patientId + '&appointmentId=' + appointment.id}
                    className="button button-ghost"
                  >
                    Registrar
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="surface">
          <div className="surface-header">
            <div>
              <div className="section-kicker">Continuidade</div>
              <h2 className="section-title">Rascunhos de sessão</h2>
            </div>
            <span className={draftSessions.length ? 'badge badge-warning' : 'badge badge-success'}>
              {draftSessions.length}
            </span>
          </div>

          <div className={styles.actionList}>
            {draftSessions.length === 0 ? (
              <div className={styles.smallEmpty}>Nenhum rascunho aberto.</div>
            ) : (
              draftSessions.slice(0, 5).map((session) => (
                <div className={styles.actionRow} key={session.id}>
                  <div>
                    <strong>{session.patientName || patientNames[session.patientId] || 'Paciente'}</strong>
                    <span>{session.mainTheme || 'Registro em andamento'}</span>
                  </div>
                  <Link to={'/sessions/' + session.id} className="button button-ghost">
                    Continuar
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <div className="surface">
          <div className="surface-header">
            <div>
              <div className="section-kicker">Histórico recente</div>
              <h2 className="section-title">Sessões finalizadas</h2>
            </div>
            <Link to="/sessions">Ver todas</Link>
          </div>

          <div className={styles.recentSessions}>
            {recentFinalized.length === 0 ? (
              <div className={styles.smallEmpty}>Nenhuma sessão finalizada recentemente.</div>
            ) : (
              recentFinalized.map((session) => (
                <Link key={session.id} to={'/sessions/' + session.id} className={styles.recentRow}>
                  <FilePenLine size={17} aria-hidden="true" />
                  <div>
                    <strong>{session.patientName || patientNames[session.patientId] || 'Paciente'}</strong>
                    <span>{session.mainTheme || 'Registro finalizado'}</span>
                  </div>
                  <span className={styles.recentDate}>
                    {toDate(session.date)?.toLocaleDateString('pt-BR') || ''}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <RecentActivities activities={activities} />
      </section>

      <section className={styles.operationalSummary} aria-label="Resumo operacional">
        <div>
          <CalendarDays size={17} aria-hidden="true" />
          <strong>{todayAppointments.length}</strong>
          <span>na agenda hoje</span>
        </div>
        <div>
          <Users size={17} aria-hidden="true" />
          <strong>{patients.length}</strong>
          <span>pacientes ativos</span>
        </div>
        <div>
          <FilePenLine size={17} aria-hidden="true" />
          <strong>{draftSessions.length}</strong>
          <span>rascunhos abertos</span>
        </div>
      </section>
    </main>
  );
}
