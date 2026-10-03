import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Edit, Plus, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getSessions } from '../../services/sessionService';
import { getPatients } from '../../services/patientService';
import { parseDateValue } from '../../utils/date';
import styles from './Sessions.module.css';

const statusMeta = {
  draft: { label: 'Rascunho', className: 'badge-warning' },
  finalized: { label: 'Finalizada', className: 'badge-success' },
  archived: { label: 'Arquivada', className: 'badge-neutral' },
  scheduled: { label: 'Legado', className: 'badge-info' }
};

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [patientNames, setPatientNames] = useState({});
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const [sessionList, patientList] = await Promise.all([
          getSessions(user.uid, 100),
          getPatients(user.uid, 'active')
        ]);

        setSessions(sessionList);
        setPatientNames(
          Object.fromEntries(patientList.map((patient) => [patient.id, patient.name]))
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sessions.filter((session) => {
      if (status !== 'all' && session.status !== status) return false;
      if (!normalizedSearch) return true;

      const patientName =
        session.patientName || patientNames[session.patientId] || '';

      return [
        patientName,
        session.mainTheme,
        session.evolution,
        ...(session.tags || [])
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [sessions, patientNames, search, status]);

  if (loading) {
    return <div className="page-shell">Carregando sessões...</div>;
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <div className="section-kicker">Atendimento</div>
          <h1 className="page-title">Sessões</h1>
          <p className="page-subtitle">
            Registros em andamento e histórico profissional, organizados para retomar contexto com rapidez.
          </p>
        </div>

        <Link className="button button-primary" to="/sessions/new">
          <Plus size={18} aria-hidden="true" />
          Nova sessão
        </Link>
      </header>

      <section className={'surface ' + styles.filters} aria-label="Filtros de sessões">
        <label className={styles.searchField}>
          <span className="sr-only">Buscar sessões</span>
          <Search size={18} aria-hidden="true" />
          <input
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por paciente, tema ou tag"
          />
        </label>

        <div className={styles.statusFilters}>
          {[
            ['all', 'Todas'],
            ['draft', 'Rascunhos'],
            ['finalized', 'Finalizadas'],
            ['archived', 'Arquivadas']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={status === value ? styles.filterActive : styles.filterButton}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.list} aria-label="Lista de sessões">
        {filtered.length === 0 ? (
          <div className="surface empty-state">
            <Edit size={30} aria-hidden="true" />
            <div>
              <strong>Nenhuma sessão encontrada</strong>
              <p>Inicie um registro ou ajuste os filtros.</p>
            </div>
            <Link className="button button-secondary" to="/sessions/new">
              Criar sessão
            </Link>
          </div>
        ) : (
          filtered.map((session) => {
            const date = parseDateValue(session.date);
            const meta = statusMeta[session.status] || statusMeta.draft;
            const patientName =
              session.patientName || patientNames[session.patientId] || 'Paciente';

            return (
              <Link
                key={session.id}
                to={'/sessions/' + session.id}
                className={'surface ' + styles.sessionCard}
              >
                <div className={styles.sessionIcon} aria-hidden="true">
                  {session.status === 'finalized' ? (
                    <CheckCircle size={19} />
                  ) : (
                    <Edit size={19} />
                  )}
                </div>

                <div className={styles.sessionMain}>
                  <div className={styles.sessionTopLine}>
                    <strong>{patientName}</strong>
                    <span className={'badge ' + meta.className}>{meta.label}</span>
                  </div>
                  <div className={styles.sessionTheme}>
                    {session.mainTheme || 'Registro sem tema definido'}
                  </div>
                  <div className={styles.sessionMeta}>
                    <Calendar size={14} aria-hidden="true" />
                    {date
                      ? date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'Data não informada'}
                    {session.version ? <span>• versão {session.version}</span> : null}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
