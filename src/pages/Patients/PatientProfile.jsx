import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Archive,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  RotateCcw,
  User
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import {
  archivePatient,
  getPatientById,
  restorePatient
} from '../../services/patientService';
import { getSessionsByPatient } from '../../services/sessionService';
import {
  getDocuments,
  getDocumentAccessUrl
} from '../../services/documentService';
import { getAppointmentsByPatient } from '../../services/appointmentService';
import styles from './PatientProfile.module.css';

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value, fallback = 'Não informado') => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('pt-BR') : fallback;
};

const formatFollowUpDuration = (createdAt) => {
  const start = toDate(createdAt);
  if (!start) return 'Não calculado';

  const days = Math.max(
    0,
    Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (days < 30) return days === 1 ? '1 dia' : days + ' dias';

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? '1 mês' : months + ' meses';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (!remainingMonths) {
    return years === 1 ? '1 ano' : years + ' anos';
  }

  return (
    (years === 1 ? '1 ano' : years + ' anos') +
    ' e ' +
    (remainingMonths === 1 ? '1 mês' : remainingMonths + ' meses')
  );
};

const appointmentStatusLabel = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  done: 'Realizado',
  canceled: 'Cancelado',
  missed: 'Não compareceu'
};

export default function PatientProfile() {
  const { id } = useParams();
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;

    const load = async () => {
      setLoading(true);
      try {
        const patientData = await getPatientById(id, user.uid);

        if (!patientData) {
          setPatient(null);
          return;
        }

        const [sessionList, documentList, appointmentList] = await Promise.all([
          getSessionsByPatient(id, user.uid),
          getDocuments(user.uid, id),
          getAppointmentsByPatient(user.uid, id)
        ]);

        setPatient(patientData);
        setSessions(sessionList);
        setDocuments(documentList);
        setAppointments(appointmentList);
      } catch {
        toast.error('Não foi possível carregar a visão do paciente.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user]);

  const finalizedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'finalized'),
    [sessions]
  );

  const lastSession = finalizedSessions[0] || sessions[0] || null;

  const nextAppointment = useMemo(() => {
    const now = new Date();

    return [...appointments]
      .filter((appointment) => {
        const date = toDate(appointment.date);
        return (
          date &&
          date >= now &&
          ['scheduled', 'confirmed'].includes(appointment.status)
        );
      })
      .sort((a, b) => toDate(a.date) - toDate(b.date))[0] || null;
  }, [appointments]);

  const timeline = useMemo(() => {
    if (!patient) return [];

    const items = [];

    if (patient.createdAt) {
      items.push({
        id: 'patient-created',
        date: toDate(patient.createdAt),
        type: 'Entrada',
        title: 'Cadastro iniciado',
        detail: 'Início do acompanhamento no PsiNote.'
      });
    }

    sessions.forEach((session) => {
      items.push({
        id: 'session-' + session.id,
        date: toDate(session.date) || toDate(session.updatedAt),
        type: 'Sessão',
        title:
          session.status === 'finalized'
            ? 'Registro de sessão finalizado'
            : 'Registro de sessão em andamento',
        detail: session.mainTheme || 'Sem tema informado.',
        href: '/sessions/' + session.id
      });
    });

    documents.forEach((document) => {
      items.push({
        id: 'document-' + document.id,
        date: toDate(document.uploadedAt) || toDate(document.createdAt),
        type: 'Documento',
        title: document.name || 'Documento',
        detail: 'Documento vinculado ao paciente.',
        document
      });
    });

    appointments.forEach((appointment) => {
      items.push({
        id: 'appointment-' + appointment.id,
        date: toDate(appointment.date),
        type: 'Agenda',
        title: 'Atendimento ' + (appointmentStatusLabel[appointment.status] || appointment.status),
        detail: appointment.time ? 'Horário: ' + appointment.time : 'Horário não informado.'
      });
    });

    if (patient.archivedAt) {
      items.push({
        id: 'patient-archived',
        date: toDate(patient.archivedAt),
        type: 'Arquivamento',
        title: 'Paciente arquivado',
        detail: 'Registro preservado para histórico e retenção.'
      });
    }

    return items
      .filter((item) => item.date)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, documents, patient, sessions]);

  const openDocument = async (documentItem) => {
    try {
      const { url, revokeAfterUse } = await getDocumentAccessUrl(
        documentItem,
        user.uid
      );

      window.open(url, '_blank', 'noopener,noreferrer');

      if (revokeAfterUse) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch {
      toast.error('Não foi possível abrir o documento.');
    }
  };

  const archive = async () => {
    if (
      !window.confirm(
        'Arquivar este paciente? Os registros serão preservados e poderão ser reativados.'
      )
    ) {
      return;
    }

    try {
      await archivePatient(id, user.uid);
      setPatient((current) => ({
        ...current,
        status: 'archived',
        archivedAt: new Date()
      }));
      toast.success('Paciente arquivado.');
    } catch {
      toast.error('Não foi possível arquivar o paciente.');
    }
  };

  const restore = async () => {
    try {
      await restorePatient(id, user.uid);
      setPatient((current) => ({
        ...current,
        status: 'active',
        archivedAt: null
      }));
      toast.success('Paciente reativado.');
    } catch {
      toast.error('Não foi possível reativar o paciente.');
    }
  };

  if (loading) {
    return <div className="page-shell">Carregando visão longitudinal...</div>;
  }

  if (!patient) {
    return (
      <main className="page-shell">
        <div className="surface empty-state">
          <User size={30} aria-hidden="true" />
          <strong>Paciente não encontrado</strong>
          <Link className="button button-secondary" to="/patients">
            Voltar para pacientes
          </Link>
        </div>
      </main>
    );
  }

  const statusClass =
    patient.status === 'active' ? 'badge-success' : 'badge-neutral';

  const tabs = [
    ['overview', 'Visão geral'],
    ['registration', 'Cadastro'],
    ['anamnesis', 'Anamnese'],
    ['timeline', 'Linha do tempo'],
    ['sessions', 'Sessões (' + sessions.length + ')'],
    ['documents', 'Documentos (' + documents.length + ')']
  ];

  return (
    <main className="page-shell">
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            {patient.name?.trim()?.charAt(0)?.toUpperCase() || 'P'}
          </div>

          <div>
            <div className={styles.nameRow}>
              <h1>{patient.name}</h1>
              <span className={'badge ' + statusClass}>
                {patient.status === 'active' ? 'Ativo' : 'Arquivado'}
              </span>
            </div>

            <div className={styles.contactLine}>
              <span>{patient.whatsapp || patient.phone || 'Telefone não informado'}</span>
              <span>•</span>
              <span>{patient.email || 'E-mail não informado'}</span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          {patient.status === 'active' ? (
            <>
              <Link
                className="button button-primary"
                to={'/sessions/new?patientId=' + patient.id}
              >
                <Plus size={17} aria-hidden="true" />
                Nova sessão
              </Link>
              <Link
                className="button button-secondary"
                to={'/patients/edit/' + patient.id}
              >
                Editar cadastro
              </Link>
              <button type="button" className="button button-ghost" onClick={archive}>
                <Archive size={17} aria-hidden="true" />
                Arquivar
              </button>
            </>
          ) : (
            <button type="button" className="button button-secondary" onClick={restore}>
              <RotateCcw size={17} aria-hidden="true" />
              Reativar
            </button>
          )}
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Seções do paciente">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={activeTab === value ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab(value)}
            aria-current={activeTab === value ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <Overview
          patient={patient}
          lastSession={lastSession}
          nextAppointment={nextAppointment}
          sessions={sessions}
          documents={documents}
        />
      )}

      {activeTab === 'registration' && <Registration patient={patient} />}

      {activeTab === 'anamnesis' && <Anamnesis patient={patient} />}

      {activeTab === 'timeline' && (
        <Timeline items={timeline} onOpenDocument={openDocument} />
      )}

      {activeTab === 'sessions' && (
        <SessionsPanel patient={patient} sessions={sessions} />
      )}

      {activeTab === 'documents' && (
        <DocumentsPanel
          patient={patient}
          documents={documents}
          onOpenDocument={openDocument}
        />
      )}
    </main>
  );
}

function Overview({
  patient,
  lastSession,
  nextAppointment,
  sessions,
  documents
}) {
  return (
    <div className={styles.overviewGrid}>
      <section className={'surface ' + styles.summaryCard}>
        <div className="surface-header">
          <div>
            <div className="section-kicker">Acompanhamento</div>
            <h2 className="section-title">Visão atual</h2>
          </div>
        </div>

        <div className={styles.summaryMetrics}>
          <Metric
            icon={Clock}
            label="Tempo de acompanhamento"
            value={formatFollowUpDuration(patient.createdAt)}
          />
          <Metric
            icon={Calendar}
            label="Última sessão"
            value={lastSession ? formatDate(lastSession.date) : 'Sem registro'}
          />
          <Metric
            icon={Calendar}
            label="Próximo atendimento"
            value={
              nextAppointment
                ? formatDate(nextAppointment.date) +
                  (nextAppointment.time ? ' às ' + nextAppointment.time : '')
                : 'Não agendado'
            }
          />
        </div>
      </section>

      <section className={'surface ' + styles.goalsCard}>
        <div className="surface-header">
          <div>
            <div className="section-kicker">Continuidade</div>
            <h2 className="section-title">Objetivos atuais</h2>
          </div>
        </div>
        <div className="surface-body">
          <p className={styles.longText}>
            {patient.anamnesis?.therapeuticGoals ||
              'Nenhum objetivo de acompanhamento registrado ainda.'}
          </p>
        </div>
      </section>

      <section className={'surface ' + styles.recentCard}>
        <div className="surface-header">
          <div>
            <div className="section-kicker">Histórico</div>
            <h2 className="section-title">Sessões recentes</h2>
          </div>
        </div>
        <div className={styles.compactList}>
          {sessions.length === 0 ? (
            <div className={styles.emptyCompact}>Nenhuma sessão registrada.</div>
          ) : (
            sessions.slice(0, 4).map((session) => (
              <Link
                key={session.id}
                className={styles.compactRow}
                to={'/sessions/' + session.id}
              >
                <div>
                  <strong>{formatDate(session.date)}</strong>
                  <span>{session.mainTheme || 'Sem tema informado'}</span>
                </div>
                <ChevronRight size={17} aria-hidden="true" />
              </Link>
            ))
          )}
        </div>
      </section>

      <section className={'surface ' + styles.recentCard}>
        <div className="surface-header">
          <div>
            <div className="section-kicker">Documentação</div>
            <h2 className="section-title">Documentos vinculados</h2>
          </div>
          <span className="badge badge-neutral">{documents.length}</span>
        </div>
        <div className="surface-body">
          <p className={styles.mutedText}>
            Use a aba Documentos para visualizar arquivos e versões vinculadas a este paciente.
          </p>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricIcon}>
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Registration({ patient }) {
  const fields = [
    ['Nome completo', patient.name],
    ['WhatsApp', patient.whatsapp || patient.phone],
    ['E-mail', patient.email],
    ['CPF', patient.cpf],
    ['Data de nascimento', patient.birthDate],
    ['Gênero', patient.gender],
    ['Estado civil', patient.maritalStatus],
    ['Profissão', patient.profession],
    ['Contato de emergência', patient.emergencyContact],
    ['Endereço', patient.address],
    ['Observações administrativas', patient.observations]
  ];

  return (
    <section className={'surface ' + styles.detailSection}>
      <div className="surface-header">
        <div>
          <div className="section-kicker">Cadastro</div>
          <h2 className="section-title">Informações essenciais</h2>
        </div>
      </div>
      <div className={styles.detailGrid}>
        {fields.map(([label, value]) => (
          <Detail key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

function Anamnesis({ patient }) {
  const anamnesis = patient.anamnesis || {};
  const fields = [
    ['Demanda principal', anamnesis.chiefComplaint],
    ['Contexto familiar', anamnesis.familyHistory],
    ['Histórico de saúde relatado', anamnesis.medicalHistory],
    ['Medicações relatadas', anamnesis.medications],
    ['Objetivos de acompanhamento', anamnesis.therapeuticGoals],
    ['Observações iniciais', anamnesis.initialObservations]
  ];

  return (
    <section className={'surface ' + styles.detailSection}>
      <div className="surface-header">
        <div>
          <div className="section-kicker">Anamnese</div>
          <h2 className="section-title">Contexto inicial</h2>
        </div>
      </div>
      <div className={styles.anamnesisList}>
        {fields.map(([label, value]) => (
          <Detail key={label} label={label} value={value} full />
        ))}
      </div>
    </section>
  );
}

function Detail({ label, value, full = false }) {
  return (
    <div className={full ? styles.detailFull : styles.detail}>
      <span>{label}</span>
      <p>{value || 'Não informado'}</p>
    </div>
  );
}

function Timeline({ items, onOpenDocument }) {
  return (
    <section className={'surface ' + styles.timelineSection}>
      <div className="surface-header">
        <div>
          <div className="section-kicker">Trajetória</div>
          <h2 className="section-title">Linha do tempo</h2>
        </div>
      </div>

      <div className={styles.timeline}>
        {items.length === 0 ? (
          <div className={styles.emptyCompact}>Nenhum evento registrado.</div>
        ) : (
          items.map((item) => {
            const content = (
              <>
                <div className={styles.timelineDot} aria-hidden="true" />
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTop}>
                    <span className="badge badge-neutral">{item.type}</span>
                    <time>{formatDate(item.date)}</time>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              </>
            );

            if (item.href) {
              return (
                <Link key={item.id} to={item.href} className={styles.timelineItem}>
                  {content}
                </Link>
              );
            }

            if (item.document) {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={styles.timelineItemButton}
                  onClick={() => onOpenDocument(item.document)}
                >
                  {content}
                </button>
              );
            }

            return (
              <div key={item.id} className={styles.timelineItem}>
                {content}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function SessionsPanel({ patient, sessions }) {
  return (
    <section className="surface">
      <div className="surface-header">
        <div>
          <div className="section-kicker">Atendimento</div>
          <h2 className="section-title">Sessões</h2>
        </div>
        {patient.status === 'active' && (
          <Link
            className="button button-primary"
            to={'/sessions/new?patientId=' + patient.id}
          >
            <Plus size={17} aria-hidden="true" />
            Nova sessão
          </Link>
        )}
      </div>

      <div className={styles.panelList}>
        {sessions.length === 0 ? (
          <div className={styles.emptyCompact}>Nenhuma sessão registrada.</div>
        ) : (
          sessions.map((session) => (
            <Link
              key={session.id}
              className={styles.panelRow}
              to={'/sessions/' + session.id}
            >
              <div>
                <strong>{formatDate(session.date)}</strong>
                <span>{session.mainTheme || 'Sem tema informado'}</span>
              </div>
              <span
                className={
                  'badge ' +
                  (session.status === 'finalized'
                    ? 'badge-success'
                    : 'badge-warning')
                }
              >
                {session.status === 'finalized' ? 'Finalizada' : 'Rascunho'}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function DocumentsPanel({ patient, documents, onOpenDocument }) {
  return (
    <section className="surface">
      <div className="surface-header">
        <div>
          <div className="section-kicker">Documentação</div>
          <h2 className="section-title">Documentos</h2>
        </div>
        <Link
          className="button button-secondary"
          to={'/documents/generate/' + patient.id}
        >
          <FileText size={17} aria-hidden="true" />
          Gerar documento
        </Link>
      </div>

      <div className={styles.panelList}>
        {documents.length === 0 ? (
          <div className={styles.emptyCompact}>Nenhum documento vinculado.</div>
        ) : (
          documents.map((document) => (
            <button
              key={document.id}
              type="button"
              className={styles.panelRowButton}
              onClick={() => onOpenDocument(document)}
            >
              <div>
                <strong>{document.name}</strong>
                <span>
                  {document.category || 'Documento'} • {formatDate(document.uploadedAt)}
                </span>
              </div>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          ))
        )}
      </div>
    </section>
  );
}
