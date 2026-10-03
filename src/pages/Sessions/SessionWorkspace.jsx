import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getPatientById, getPatients } from '../../services/patientService';
import {
  autoSaveSession,
  createSession,
  finalizeSession,
  getSessionById,
  getSessionsByPatient,
  reopenSession,
  updateSession
} from '../../services/sessionService';
import { markAppointmentRecordCompleted } from '../../services/appointmentService';
import styles from './SessionWorkspace.module.css';

const EMPTY_FORM = {
  patientId: '',
  date: new Date().toISOString().slice(0, 10),
  mainTheme: '',
  observations: '',
  evolution: '',
  interventions: '',
  referrals: '',
  agreements: '',
  nextSteps: '',
  tagsText: ''
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInput = (value) => {
  const date = toDate(value);
  if (!date) return new Date().toISOString().slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const buildPayload = (form) => ({
  patientId: form.patientId,
  date: new Date(form.date + 'T12:00:00'),
  mainTheme: form.mainTheme.trim(),
  observations: form.observations.trim(),
  evolution: form.evolution.trim(),
  interventions: form.interventions.trim(),
  referrals: form.referrals.trim(),
  agreements: form.agreements.trim(),
  nextSteps: form.nextSteps.trim(),
  tags: form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20)
});

const normalizeSessionForForm = (session) => ({
  patientId: session.patientId || '',
  date: toDateInput(session.date),
  mainTheme: session.mainTheme || '',
  observations: session.observations || '',
  evolution: session.evolution || '',
  interventions: session.interventions || '',
  referrals: session.referrals || '',
  agreements: session.agreements || '',
  nextSteps: session.nextSteps || '',
  tagsText: Array.isArray(session.tags) ? session.tags.join(', ') : ''
});

const signature = (value) => JSON.stringify(value);

export default function SessionWorkspace() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id;
  const patientParam = searchParams.get('patientId') || '';
  const appointmentId = searchParams.get('appointmentId') || '';

  const [form, setForm] = useState({ ...EMPTY_FORM, patientId: patientParam });
  const [session, setSession] = useState(null);
  const [patient, setPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  const hydrated = useRef(false);
  const lastSaved = useRef('');

  useEffect(() => {
    if (!user) return;

    if (isNew) {
      getPatients(user.uid, 'active')
        .then((list) => {
          setPatients(list);
          setPatient(list.find((item) => item.id === patientParam) || null);
        })
        .catch(() => toast.error('Não foi possível carregar os pacientes.'));
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const existing = await getSessionById(id, user.uid);
        if (!existing) {
          navigate('/sessions', { replace: true });
          return;
        }

        const nextForm = normalizeSessionForForm(existing);
        setSession(existing);
        setForm(nextForm);
        lastSaved.current = signature(nextForm);

        const [patientData, sessionHistory] = await Promise.all([
          getPatientById(existing.patientId, user.uid),
          getSessionsByPatient(existing.patientId, user.uid)
        ]);

        setPatient(patientData);
        setHistory(sessionHistory.filter((item) => item.id !== existing.id).slice(0, 4));
        hydrated.current = true;
      } catch {
        toast.error('Não foi possível abrir a sessão.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isNew, navigate, patientParam, user]);

  useEffect(() => {
    if (isNew || !session?.id || session.status === 'finalized' || !hydrated.current) return;

    const currentSignature = signature(form);
    if (currentSignature === lastSaved.current) return;

    setSaveStatus('dirty');
    const snapshot = { ...form };

    const timer = window.setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await autoSaveSession(session.id, user.uid, buildPayload(snapshot));
        lastSaved.current = signature(snapshot);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [form, isNew, session?.id, session?.status, user]);

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!['dirty', 'saving', 'error'].includes(saveStatus)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [saveStatus]);

  const previousSession = useMemo(
    () => history.find((item) => item.status === 'finalized') || history[0],
    [history]
  );

  const change = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createDraft = async () => {
    if (!form.patientId || !form.date) {
      toast.warning('Selecione um paciente e informe a data.');
      return;
    }

    setCreating(true);
    try {
      const selected = patient || patients.find((item) => item.id === form.patientId);
      const existing = await getSessionsByPatient(form.patientId, user.uid);
      const created = await createSession(user.uid, {
        patientId: form.patientId,
        patientName: selected?.name || 'Paciente',
        appointmentId: appointmentId || null,
        sessionNumber: existing.length + 1,
        ...buildPayload(form)
      });
      navigate('/sessions/' + created.id, { replace: true });
    } catch (error) {
      toast.error('Não foi possível iniciar o registro: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const manualSave = async () => {
    setSaveStatus('saving');
    try {
      const updated = await updateSession(session.id, user.uid, buildPayload(form), true);
      setSession((current) => ({ ...current, version: updated.version }));
      lastSaved.current = signature(form);
      setSaveStatus('saved');
      toast.success('Registro salvo e versionado.');
    } catch {
      setSaveStatus('error');
      toast.error('Não foi possível salvar.');
    }
  };

  const finish = async () => {
    if (!(form.mainTheme.trim() || form.observations.trim() || form.evolution.trim())) {
      toast.warning('Registre ao menos uma informação antes de finalizar.');
      return;
    }

    if (!window.confirm('Finalizar este registro? Novas edições exigirão reabertura explícita.')) return;

    setSaveStatus('saving');
    try {
      const updated = await finalizeSession(session.id, user.uid, buildPayload(form));
      if (session.appointmentId) {
        await markAppointmentRecordCompleted(session.appointmentId, user.uid, session.id);
      }
      setSession((current) => ({ ...current, status: 'finalized', version: updated.version }));
      lastSaved.current = signature(form);
      setSaveStatus('saved');
      toast.success('Registro finalizado.');
    } catch {
      setSaveStatus('error');
      toast.error('Não foi possível finalizar.');
    }
  };

  const reopen = async () => {
    if (!window.confirm('Reabrir este registro para edição?')) return;
    try {
      await reopenSession(session.id, user.uid);
      setSession((current) => ({ ...current, status: 'draft' }));
      toast.info('Registro reaberto.');
    } catch {
      toast.error('Não foi possível reabrir.');
    }
  };

  if (loading) return <div className="page-shell">Carregando sessão...</div>;

  if (isNew) {
    return (
      <main className="page-shell">
        <header className="page-header">
          <div>
            <div className="section-kicker">Atendimento</div>
            <h1 className="page-title">Nova sessão</h1>
            <p className="page-subtitle">Crie um rascunho vinculado ao paciente e continue no workspace.</p>
          </div>
          <Link to="/sessions" className="button button-secondary">
            <ArrowLeft size={18} aria-hidden="true" />
            Voltar
          </Link>
        </header>

        <section className={'surface ' + styles.createCard}>
          <div className="field">
            <label className="field-label" htmlFor="session-patient">Paciente</label>
            <select
              id="session-patient"
              className="select"
              value={form.patientId}
              onChange={(event) => {
                change('patientId', event.target.value);
                setPatient(patients.find((item) => item.id === event.target.value) || null);
              }}
            >
              <option value="">Selecione</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="session-date">Data</label>
            <input
              id="session-date"
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => change('date', event.target.value)}
            />
          </div>

          <button
            type="button"
            className="button button-primary"
            onClick={createDraft}
            disabled={creating}
          >
            {creating ? 'Criando rascunho...' : 'Iniciar registro'}
          </button>
        </section>
      </main>
    );
  }

  const finalized = session?.status === 'finalized';

  return (
    <main className="page-shell">
      <header className={styles.workspaceHeader}>
        <div className={styles.identity}>
          <Link to="/sessions" className={styles.backButton} aria-label="Voltar para sessões">
            <ArrowLeft size={19} aria-hidden="true" />
          </Link>
          <div>
            <div className="section-kicker">Sessão {session?.sessionNumber || ''}</div>
            <h1 className={styles.patientName}>{patient?.name || session?.patientName || 'Paciente'}</h1>
            <div className={styles.meta}>
              <span>{toDate(form.date)?.toLocaleDateString('pt-BR') || form.date}</span>
              <span className={'badge ' + (finalized ? 'badge-success' : 'badge-warning')}>
                {finalized ? 'Finalizada' : 'Rascunho'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <SaveState status={saveStatus} />
          {finalized ? (
            <button type="button" className="button button-secondary" onClick={reopen}>
              Reabrir
            </button>
          ) : (
            <>
              <button type="button" className="button button-secondary" onClick={manualSave}>
                <Save size={17} aria-hidden="true" />
                Salvar versão
              </button>
              <button type="button" className="button button-primary" onClick={finish}>
                <CheckCircle2 size={17} aria-hidden="true" />
                Finalizar
              </button>
            </>
          )}
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.context}>
          <section className="surface">
            <div className="surface-header">
              <div>
                <div className="section-kicker">Contexto</div>
                <h2 className="section-title">Objetivos atuais</h2>
              </div>
            </div>
            <div className="surface-body">
              <p className={styles.contextText}>
                {patient?.anamnesis?.therapeuticGoals || 'Nenhum objetivo registrado.'}
              </p>
              {patient?.id && (
                <Link className={styles.inlineLink} to={'/patients/' + patient.id}>
                  Abrir visão do paciente
                </Link>
              )}
            </div>
          </section>

          <section className="surface">
            <div className="surface-header">
              <div>
                <div className="section-kicker">Continuidade</div>
                <h2 className="section-title">Sessão anterior</h2>
              </div>
            </div>
            <div className="surface-body">
              {previousSession ? (
                <div className={styles.previous}>
                  <strong>{toDate(previousSession.date)?.toLocaleDateString('pt-BR') || 'Anterior'}</strong>
                  <p>{previousSession.mainTheme || 'Sem tema registrado.'}</p>
                  {previousSession.agreements && (
                    <div className={styles.callout}>
                      <span>Acordos</span>
                      <p>{previousSession.agreements}</p>
                    </div>
                  )}
                  {previousSession.nextSteps && (
                    <div className={styles.callout}>
                      <span>Próximos passos</span>
                      <p>{previousSession.nextSteps}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.contextText}>Sem sessão anterior registrada.</p>
              )}
            </div>
          </section>
        </aside>

        <section className={'surface ' + styles.editor}>
          <div className={styles.editorIntro}>
            <div className="section-kicker">Registro profissional</div>
            <h2>Registro narrativo com estrutura leve</h2>
            <p>Use apenas os campos que ajudarem a continuidade do trabalho.</p>
          </div>

          <div className={styles.form}>
            <Field
              label="Tema principal"
              value={form.mainTheme}
              onChange={(value) => change('mainTheme', value)}
              disabled={finalized}
              rows={2}
              placeholder="Síntese breve do foco desta sessão"
            />
            <Field
              label="Observações"
              value={form.observations}
              onChange={(value) => change('observations', value)}
              disabled={finalized}
              rows={5}
            />
            <Field
              label="Evolução"
              value={form.evolution}
              onChange={(value) => change('evolution', value)}
              disabled={finalized}
              rows={5}
            />

            <div className={styles.twoColumns}>
              <Field
                label="Intervenções / recursos"
                value={form.interventions}
                onChange={(value) => change('interventions', value)}
                disabled={finalized}
                rows={4}
              />
              <Field
                label="Encaminhamentos"
                value={form.referrals}
                onChange={(value) => change('referrals', value)}
                disabled={finalized}
                rows={4}
              />
            </div>

            <div className={styles.twoColumns}>
              <Field
                label="Acordos"
                value={form.agreements}
                onChange={(value) => change('agreements', value)}
                disabled={finalized}
                rows={4}
              />
              <Field
                label="Próximos passos"
                value={form.nextSteps}
                onChange={(value) => change('nextSteps', value)}
                disabled={finalized}
                rows={4}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="session-tags">Tags de organização</label>
              <input
                id="session-tags"
                className="input"
                value={form.tagsText}
                onChange={(event) => change('tagsText', event.target.value)}
                disabled={finalized}
                placeholder="acompanhamento, retorno, família"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, disabled, rows, placeholder = '' }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <textarea
        className="textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}

function SaveState({ status }) {
  const view = {
    saved: ['Salvo', styles.saved],
    dirty: ['Alterações pendentes', styles.pending],
    saving: ['Salvando...', styles.pending],
    error: ['Falha ao salvar', styles.error]
  }[status];

  return (
    <div className={view[1]} role="status" aria-live="polite">
      <Clock3 size={14} aria-hidden="true" />
      {view[0]}
    </div>
  );
}
