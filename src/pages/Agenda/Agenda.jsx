import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Repeat,
  Video,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import {
  createAppointmentSeries,
  getAppointments,
  rescheduleAppointment,
  updateAppointmentStatus
} from '../../services/appointmentService';
import { getPatients } from '../../services/patientService';
import {
  addDays,
  agendaRange,
  dateKey,
  formatAgendaRange,
  isSameDay,
  monthGridDays,
  moveAgendaCursor,
  startOfWeek
} from '../../utils/calendar';
import { parseDateValue } from '../../utils/date';
import styles from './Agenda.module.css';

const STATUS_META = {
  scheduled: { label: 'Agendado', badge: 'badge-warning' },
  confirmed: { label: 'Confirmado', badge: 'badge-info' },
  done: { label: 'Realizado', badge: 'badge-success' },
  canceled: { label: 'Cancelado', badge: 'badge-danger' },
  rescheduled: { label: 'Remarcado', badge: 'badge-neutral' },
  missed: { label: 'Não compareceu', badge: 'badge-neutral' }
};

const MODALITY_META = {
  in_person: { label: 'Presencial', icon: Calendar },
  online: { label: 'On-line', icon: Video },
  other: { label: 'Outro', icon: Calendar }
};

const EMPTY_FORM = {
  patientId: '',
  date: dateKey(new Date()),
  time: '',
  duration: 50,
  modality: 'in_person',
  notes: '',
  recurrenceKind: 'none',
  recurrenceOccurrences: 4
};

const sortAppointments = (items) =>
  [...items].sort((left, right) => {
    const dateCompare = String(left.date || '').localeCompare(String(right.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(left.time || '').localeCompare(String(right.time || ''));
  });

export default function Agenda() {
  const { user } = useAuth();
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '' });
  const [saving, setSaving] = useState(false);

  const range = useMemo(() => agendaRange(view, cursor), [view, cursor]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getAppointments(user.uid, range.start, range.end);
      setAppointments(sortAppointments(list));
    } catch {
      toast.error('Não foi possível carregar a agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAppointments();
  }, [user, range.start, range.end]);

  useEffect(() => {
    if (!user) return;
    getPatients(user.uid, 'active')
      .then(setPatients)
      .catch(() => toast.error('Não foi possível carregar os pacientes.'));
  }, [user]);

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (statusFilter !== 'all' && appointment.status !== statusFilter) {
          return false;
        }
        if (patientFilter && appointment.patientId !== patientFilter) {
          return false;
        }
        return true;
      }),
    [appointments, patientFilter, statusFilter]
  );

  const openCreate = (date = cursor) => {
    setForm({
      ...EMPTY_FORM,
      date: dateKey(date) || dateKey(new Date())
    });
    setShowCreate(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.patientId || !form.date || !form.time) {
      toast.warning('Selecione paciente, data e horário.');
      return;
    }

    const patient = patients.find((item) => item.id === form.patientId);
    if (!patient) {
      toast.warning('Selecione um paciente válido.');
      return;
    }

    setSaving(true);
    try {
      const created = await createAppointmentSeries(
        user.uid,
        {
          patientId: form.patientId,
          patientName: patient.name,
          date: form.date,
          time: form.time,
          duration: form.duration,
          modality: form.modality,
          notes: form.notes
        },
        {
          kind: form.recurrenceKind,
          occurrences:
            form.recurrenceKind === 'none'
              ? 1
              : Number(form.recurrenceOccurrences)
        }
      );

      toast.success(
        created.length === 1
          ? 'Atendimento agendado.'
          : created.length + ' atendimentos recorrentes criados.'
      );
      setShowCreate(false);
      await loadAppointments();
    } catch (error) {
      toast.error('Não foi possível agendar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (appointment, status) => {
    if (status === 'canceled') {
      setCancelTarget(appointment);
      setCancelReason('');
      return;
    }

    try {
      await updateAppointmentStatus(appointment.id, user.uid, status);
      toast.success('Status atualizado.');
      await loadAppointments();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmCancel = async (event) => {
    event.preventDefault();
    if (!cancelReason.trim()) {
      toast.warning('Informe o motivo do cancelamento.');
      return;
    }

    setSaving(true);
    try {
      await updateAppointmentStatus(
        cancelTarget.id,
        user.uid,
        'canceled',
        cancelReason
      );
      setCancelTarget(null);
      setCancelReason('');
      toast.success('Atendimento cancelado.');
      await loadAppointments();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const openReschedule = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleForm({
      date: dateKey(appointment.date),
      time: appointment.time || ''
    });
  };

  const confirmReschedule = async (event) => {
    event.preventDefault();

    if (!rescheduleForm.date || !rescheduleForm.time) {
      toast.warning('Informe a nova data e o horário.');
      return;
    }

    setSaving(true);
    try {
      await rescheduleAppointment(
        rescheduleTarget.id,
        user.uid,
        rescheduleForm.date,
        rescheduleForm.time
      );
      setRescheduleTarget(null);
      toast.success('Novo agendamento criado; o anterior foi preservado.');
      await loadAppointments();
    } catch (error) {
      toast.error('Não foi possível remarcar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const appointmentActions = {
    changeStatus,
    openReschedule
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <div className="section-kicker">Hoje</div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">
            Organize o trabalho do dia, confirme atendimentos e transforme consultas realizadas em registros.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={() => openCreate(cursor)}
        >
          <Plus size={18} aria-hidden="true" />
          Novo agendamento
        </button>
      </header>

      <section className={'surface ' + styles.toolbar} aria-label="Controles da agenda">
        <div className={styles.navigation}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setCursor(moveAgendaCursor(view, cursor, -1))}
            aria-label="Período anterior"
          >
            <ChevronLeft size={19} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setCursor(new Date())}
          >
            Hoje
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setCursor(moveAgendaCursor(view, cursor, 1))}
            aria-label="Próximo período"
          >
            <ChevronRight size={19} aria-hidden="true" />
          </button>
          <strong className={styles.rangeLabel}>{formatAgendaRange(view, cursor)}</strong>
        </div>

        <div className={styles.viewSwitch} aria-label="Modo de visualização">
          {[
            ['day', 'Dia'],
            ['week', 'Semana'],
            ['month', 'Mês'],
            ['list', 'Lista']
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={view === value ? styles.viewActive : styles.viewButton}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.filterBar} aria-label="Filtros da agenda">
        <select
          className="select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_META).map(([value, meta]) => (
            <option key={value} value={value}>{meta.label}</option>
          ))}
        </select>

        <select
          className="select"
          value={patientFilter}
          onChange={(event) => setPatientFilter(event.target.value)}
          aria-label="Filtrar por paciente"
        >
          <option value="">Todos os pacientes</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>{patient.name}</option>
          ))}
        </select>
      </section>

      {loading ? (
        <div className="surface empty-state">Carregando período...</div>
      ) : (
        <AgendaView
          view={view}
          cursor={cursor}
          appointments={filteredAppointments}
          onOpenCreate={openCreate}
          onOpenDay={(date) => {
            setCursor(date);
            setView('day');
          }}
          actions={appointmentActions}
        />
      )}

      {showCreate && (
        <CreateAppointmentDialog
          form={form}
          setForm={setForm}
          patients={patients}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
          saving={saving}
        />
      )}

      {cancelTarget && (
        <Dialog title="Cancelar atendimento" onClose={() => setCancelTarget(null)}>
          <form className={styles.dialogForm} onSubmit={confirmCancel}>
            <p>
              {cancelTarget.patientName} • {cancelTarget.date} às {cancelTarget.time}
            </p>
            <div className="field">
              <label className="field-label" htmlFor="cancel-reason">
                Motivo administrativo
              </label>
              <textarea
                id="cancel-reason"
                className="textarea"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                autoFocus
              />
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className="button button-secondary" onClick={() => setCancelTarget(null)}>
                Voltar
              </button>
              <button type="submit" className="button button-danger" disabled={saving}>
                Confirmar cancelamento
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {rescheduleTarget && (
        <Dialog title="Remarcar atendimento" onClose={() => setRescheduleTarget(null)}>
          <form className={styles.dialogForm} onSubmit={confirmReschedule}>
            <p>
              O compromisso atual será preservado no histórico e um novo agendamento será criado.
            </p>
            <div className={styles.twoFields}>
              <div className="field">
                <label className="field-label" htmlFor="reschedule-date">Nova data</label>
                <input
                  id="reschedule-date"
                  type="date"
                  className="input"
                  value={rescheduleForm.date}
                  onChange={(event) =>
                    setRescheduleForm((current) => ({
                      ...current,
                      date: event.target.value
                    }))
                  }
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="reschedule-time">Novo horário</label>
                <input
                  id="reschedule-time"
                  type="time"
                  className="input"
                  value={rescheduleForm.time}
                  onChange={(event) =>
                    setRescheduleForm((current) => ({
                      ...current,
                      time: event.target.value
                    }))
                  }
                />
              </div>
            </div>
            <div className={styles.dialogActions}>
              <button type="button" className="button button-secondary" onClick={() => setRescheduleTarget(null)}>
                Voltar
              </button>
              <button type="submit" className="button button-primary" disabled={saving}>
                Criar novo agendamento
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </main>
  );
}

function AgendaView({
  view,
  cursor,
  appointments,
  onOpenCreate,
  onOpenDay,
  actions
}) {
  if (view === 'day') {
    return (
      <DayView
        date={cursor}
        appointments={appointments}
        onOpenCreate={onOpenCreate}
        actions={actions}
      />
    );
  }

  if (view === 'month') {
    return (
      <MonthView
        cursor={cursor}
        appointments={appointments}
        onOpenDay={onOpenDay}
        onOpenCreate={onOpenCreate}
      />
    );
  }

  if (view === 'list') {
    return <ListView appointments={appointments} actions={actions} />;
  }

  return (
    <WeekView
      cursor={cursor}
      appointments={appointments}
      onOpenCreate={onOpenCreate}
      actions={actions}
    />
  );
}

function DayView({ date, appointments, onOpenCreate, actions }) {
  const dayAppointments = appointments.filter((item) => isSameDay(item.date, date));

  return (
    <section className="surface">
      <div className="surface-header">
        <div>
          <div className="section-kicker">Dia</div>
          <h2 className="section-title">
            {parseDateValue(date)?.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long'
            })}
          </h2>
        </div>
        <button type="button" className="button button-secondary" onClick={() => onOpenCreate(date)}>
          <Plus size={16} aria-hidden="true" />
          Agendar neste dia
        </button>
      </div>
      <div className={styles.dayList}>
        {dayAppointments.length ? (
          dayAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              actions={actions}
            />
          ))
        ) : (
          <div className="empty-state">
            <Calendar size={28} aria-hidden="true" />
            <span>Nenhum atendimento neste dia.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function WeekView({ cursor, appointments, onOpenCreate, actions }) {
  const first = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(first, index));

  return (
    <section className={styles.weekScroller} aria-label="Agenda semanal">
      <div className={styles.weekGrid}>
        {days.map((day) => {
          const dayItems = appointments.filter((item) => isSameDay(item.date, day));
          const today = isSameDay(day, new Date());

          return (
            <div
              key={dateKey(day)}
              className={'surface ' + styles.weekDay + (today ? ' ' + styles.today : '')}
            >
              <div className={styles.weekDayHeader}>
                <div>
                  <span>{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  <strong>{day.getDate()}</strong>
                </div>
                <button
                  type="button"
                  className={styles.smallAdd}
                  onClick={() => onOpenCreate(day)}
                  aria-label={'Agendar em ' + day.toLocaleDateString('pt-BR')}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.weekItems}>
                {dayItems.length ? (
                  dayItems.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      actions={actions}
                      compact
                    />
                  ))
                ) : (
                  <span className={styles.noAppointments}>Sem atendimentos</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MonthView({ cursor, appointments, onOpenDay, onOpenCreate }) {
  const days = monthGridDays(cursor);
  const cursorMonth = cursor.getMonth();

  return (
    <section className={'surface ' + styles.month}>
      <div className={styles.monthWeekdays} aria-hidden="true">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.monthGrid}>
        {days.map((day) => {
          const items = appointments.filter((item) => isSameDay(item.date, day));
          const outside = day.getMonth() !== cursorMonth;
          const today = isSameDay(day, new Date());

          return (
            <div
              key={dateKey(day)}
              className={
                styles.monthDay +
                (outside ? ' ' + styles.outsideMonth : '') +
                (today ? ' ' + styles.today : '')
              }
            >
              <div className={styles.monthDayTop}>
                <button type="button" onClick={() => onOpenDay(day)}>
                  {day.getDate()}
                </button>
                <button
                  type="button"
                  className={styles.monthAdd}
                  onClick={() => onOpenCreate(day)}
                  aria-label={'Agendar em ' + day.toLocaleDateString('pt-BR')}
                >
                  <Plus size={13} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.monthEvents}>
                {items.slice(0, 3).map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    className={styles.monthEvent}
                    onClick={() => onOpenDay(day)}
                  >
                    <span>{appointment.time}</span>
                    <strong>{appointment.patientName}</strong>
                  </button>
                ))}
                {items.length > 3 && (
                  <button
                    type="button"
                    className={styles.moreEvents}
                    onClick={() => onOpenDay(day)}
                  >
                    +{items.length - 3} outros
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ListView({ appointments, actions }) {
  const groups = appointments.reduce((accumulator, appointment) => {
    const key = dateKey(appointment.date) || 'unknown';
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(appointment);
    return accumulator;
  }, {});

  const keys = Object.keys(groups).sort();

  if (!keys.length) {
    return <div className="surface empty-state">Nenhum atendimento no período.</div>;
  }

  return (
    <div className={styles.listGroups}>
      {keys.map((key) => (
        <section key={key} className="surface">
          <div className="surface-header">
            <div>
              <div className="section-kicker">Lista</div>
              <h2 className="section-title">
                {parseDateValue(key)?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
            </div>
          </div>
          <div className={styles.dayList}>
            {groups[key].map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actions={actions}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AppointmentCard({ appointment, actions, compact = false }) {
  const status = STATUS_META[appointment.status] || STATUS_META.scheduled;
  const modality = MODALITY_META[appointment.modality] || MODALITY_META.in_person;
  const ModalityIcon = modality.icon;
  const isOpen = ['scheduled', 'confirmed'].includes(appointment.status);
  const canReschedule = ['scheduled', 'confirmed', 'canceled', 'missed'].includes(appointment.status);

  return (
    <article className={compact ? styles.appointmentCompact : styles.appointmentCard}>
      <div className={styles.appointmentTime}>
        <strong>{appointment.time || '--:--'}</strong>
        {!compact && <span>{appointment.duration || 50} min</span>}
      </div>

      <div className={styles.appointmentMain}>
        <div className={styles.appointmentTitle}>
          <strong>{appointment.patientName || 'Paciente'}</strong>
          <span className={'badge ' + status.badge}>{status.label}</span>
        </div>

        <div className={styles.appointmentMeta}>
          <span>
            <ModalityIcon size={14} aria-hidden="true" />
            {modality.label}
          </span>
          {appointment.recurrence?.total > 1 && (
            <span>
              <Repeat size={14} aria-hidden="true" />
              {appointment.recurrence.index + 1}/{appointment.recurrence.total}
            </span>
          )}
          {appointment.status === 'done' && !appointment.recordCompletedAt && (
            <span className={styles.recordPending}>Registro pendente</span>
          )}
        </div>

        {!compact && appointment.notes && (
          <p className={styles.appointmentNotes}>{appointment.notes}</p>
        )}

        {!compact && appointment.cancelReason && (
          <p className={styles.cancelReason}>Motivo: {appointment.cancelReason}</p>
        )}
      </div>

      <div className={styles.appointmentActions}>
        {appointment.status === 'scheduled' && (
          <button
            type="button"
            className="button button-ghost"
            onClick={() => actions.changeStatus(appointment, 'confirmed')}
          >
            <Check size={15} aria-hidden="true" />
            Confirmar
          </button>
        )}

        {isOpen && (
          <>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => actions.changeStatus(appointment, 'done')}
            >
              Realizado
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => actions.changeStatus(appointment, 'missed')}
            >
              Não compareceu
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => actions.changeStatus(appointment, 'canceled')}
            >
              Cancelar
            </button>
          </>
        )}

        {appointment.status === 'done' && (
          <Link
            className="button button-ghost"
            to={
              appointment.sessionId
                ? '/sessions/' + appointment.sessionId
                : '/sessions/new?patientId=' +
                  appointment.patientId +
                  '&appointmentId=' +
                  appointment.id
            }
          >
            <FileText size={15} aria-hidden="true" />
            {appointment.sessionId ? 'Abrir registro' : 'Registrar sessão'}
          </Link>
        )}

        {canReschedule && (
          <button
            type="button"
            className="button button-ghost"
            onClick={() => actions.openReschedule(appointment)}
          >
            Remarcar
          </button>
        )}
      </div>
    </article>
  );
}

function CreateAppointmentDialog({
  form,
  setForm,
  patients,
  onClose,
  onSubmit,
  saving
}) {
  const recurring = form.recurrenceKind !== 'none';

  return (
    <Dialog title="Novo agendamento" onClose={onClose}>
      <form className={styles.dialogForm} onSubmit={onSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="appointment-patient">Paciente</label>
          <select
            id="appointment-patient"
            className="select"
            value={form.patientId}
            onChange={(event) =>
              setForm((current) => ({ ...current, patientId: event.target.value }))
            }
            required
          >
            <option value="">Selecione</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.twoFields}>
          <div className="field">
            <label className="field-label" htmlFor="appointment-date">Data</label>
            <input
              id="appointment-date"
              type="date"
              className="input"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({ ...current, date: event.target.value }))
              }
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="appointment-time">Horário</label>
            <input
              id="appointment-time"
              type="time"
              className="input"
              value={form.time}
              onChange={(event) =>
                setForm((current) => ({ ...current, time: event.target.value }))
              }
              required
            />
          </div>
        </div>

        <div className={styles.twoFields}>
          <div className="field">
            <label className="field-label" htmlFor="appointment-duration">Duração</label>
            <input
              id="appointment-duration"
              type="number"
              min="15"
              max="240"
              step="5"
              className="input"
              value={form.duration}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  duration: Number(event.target.value)
                }))
              }
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="appointment-modality">Modalidade</label>
            <select
              id="appointment-modality"
              className="select"
              value={form.modality}
              onChange={(event) =>
                setForm((current) => ({ ...current, modality: event.target.value }))
              }
            >
              <option value="in_person">Presencial</option>
              <option value="online">On-line</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>

        <div className={styles.twoFields}>
          <div className="field">
            <label className="field-label" htmlFor="appointment-recurrence">Recorrência</label>
            <select
              id="appointment-recurrence"
              className="select"
              value={form.recurrenceKind}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recurrenceKind: event.target.value
                }))
              }
            >
              <option value="none">Não repetir</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">A cada 2 semanas</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          {recurring && (
            <div className="field">
              <label className="field-label" htmlFor="appointment-occurrences">
                Número de ocorrências
              </label>
              <input
                id="appointment-occurrences"
                type="number"
                min="2"
                max="52"
                className="input"
                value={form.recurrenceOccurrences}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recurrenceOccurrences: Number(event.target.value)
                  }))
                }
              />
            </div>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="appointment-notes">
            Observação administrativa
          </label>
          <textarea
            id="appointment-notes"
            className="textarea"
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Ex.: orientação de chegada, sala, informação operacional"
          />
        </div>

        <div className={styles.dialogActions}>
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Salvando...' : recurring ? 'Criar série' : 'Agendar'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function Dialog({ title, children, onClose }) {
  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-dialog-title"
      >
        <header className={styles.dialogHeader}>
          <h2 id="agenda-dialog-title">{title}</h2>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Fechar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
