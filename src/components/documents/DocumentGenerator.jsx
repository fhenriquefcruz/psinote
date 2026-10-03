import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  LockKeyhole,
  Save
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { getPatientById, getPatients } from '../../services/patientService';
import {
  createDocumentDraft,
  getDocumentDraft,
  updateDocumentDraft
} from '../../services/documentDraftService';
import { issueGeneratedDocument } from '../../services/documentService';
import { generateDocumentPDF } from '../../services/documentGeneratorService';
import {
  DOCUMENT_AVAILABILITY,
  DOCUMENT_TEMPLATES,
  ENABLED_DOCUMENT_TEMPLATES,
  getDocumentTemplate,
  initialDocumentValues,
  renderDocumentModel,
  validateDocumentValues
} from '../../domain/documentTemplates';
import { safeDocumentFileName } from '../../domain/documents';
import styles from './DocumentGenerator.module.css';

export default function DocumentGenerator({ patientId: routePatientId }) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftParam = searchParams.get('draftId');

  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(routePatientId || '');
  const [patient, setPatient] = useState(null);
  const [templateId, setTemplateId] = useState(
    ENABLED_DOCUMENT_TEMPLATES[0]?.id || ''
  );
  const [values, setValues] = useState({});
  const [draftId, setDraftId] = useState(draftParam || null);
  const [draftStatus, setDraftStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState('');
  const [working, setWorking] = useState(false);
  const [loading, setLoading] = useState(Boolean(draftParam));

  const template = useMemo(
    () => getDocumentTemplate(templateId),
    [templateId]
  );

  const revokePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!user) return;

    getPatients(user.uid, 'active')
      .then(setPatients)
      .catch(() => toast.error('Não foi possível carregar os pacientes.'));
  }, [user]);

  useEffect(() => {
    if (!user || !draftParam) return;

    let active = true;

    const loadDraft = async () => {
      setLoading(true);
      try {
        const draft = await getDocumentDraft(draftParam, user.uid);
        if (!draft || draft.status !== 'draft') {
          toast.error('Rascunho indisponível.');
          navigate('/documents', { replace: true });
          return;
        }

        const draftTemplate = getDocumentTemplate(
          draft.templateId,
          draft.templateVersion
        );

        if (!draftTemplate) {
          toast.error('A versão do template deste rascunho não está disponível.');
          navigate('/documents', { replace: true });
          return;
        }

        if (!active) return;
        setDraftId(draft.id);
        setTemplateId(draft.templateId);
        setPatientId(draft.patientId || '');
        setValues(draft.values || {});
        setDraftStatus('saved');
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDraft();
    return () => {
      active = false;
    };
  }, [draftParam, navigate, user]);

  useEffect(() => {
    if (!user || !patientId) {
      setPatient(null);
      return;
    }

    getPatientById(patientId, user.uid)
      .then(setPatient)
      .catch(() => toast.error('Não foi possível carregar o paciente.'));
  }, [patientId, user]);

  useEffect(() => {
    if (!template || draftParam) return;

    setValues((current) => {
      const next = initialDocumentValues(template);
      return Object.keys(current).length ? current : next;
    });
  }, [draftParam, template]);

  const selectTemplate = (nextTemplateId) => {
    if (draftId) {
      toast.info('O template fica bloqueado depois que o rascunho é salvo.');
      return;
    }

    revokePreview();
    setTemplateId(nextTemplateId);
    const nextTemplate = getDocumentTemplate(nextTemplateId);
    setValues(nextTemplate ? initialDocumentValues(nextTemplate) : {});
    setErrors({});
    setDraftStatus('idle');
  };

  const changeValue = (fieldId, value) => {
    revokePreview();
    setValues((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
    if (draftId) setDraftStatus('dirty');
  };

  const ensureProfessionalIdentity = () => {
    if (!userProfile?.name || !userProfile?.crp || !userProfile?.crpUf) {
      toast.error(
        'Complete nome e registro profissional (CRP/UF) nas configurações antes de emitir.'
      );
      return false;
    }
    return true;
  };

  const persistDraft = async () => {
    if (!patientId) {
      toast.warning('Selecione a pessoa atendida.');
      return null;
    }

    if (!template || template.availability !== DOCUMENT_AVAILABILITY.ENABLED) {
      toast.warning('Este modelo ainda não está disponível para emissão.');
      return null;
    }

    setWorking(true);
    setDraftStatus('saving');

    try {
      if (draftId) {
        await updateDocumentDraft(draftId, user.uid, values);
        setDraftStatus('saved');
        toast.success('Rascunho atualizado.');
        return draftId;
      }

      const created = await createDocumentDraft({
        psychologistId: user.uid,
        patientId,
        patientName: patient?.name || '',
        template,
        values
      });

      setDraftId(created.id);
      setDraftStatus('saved');
      setSearchParams({ draftId: created.id }, { replace: true });
      toast.success('Rascunho salvo.');
      return created.id;
    } catch (error) {
      setDraftStatus('error');
      toast.error('Não foi possível salvar o rascunho: ' + error.message);
      return null;
    } finally {
      setWorking(false);
    }
  };

  const buildValidatedModel = () => {
    if (!patientId || !patient) {
      toast.warning('Selecione a pessoa atendida.');
      return null;
    }

    if (!ensureProfessionalIdentity()) return null;

    const validation = validateDocumentValues(template, values);
    setErrors(validation.errors);

    if (!validation.valid) {
      toast.warning('Revise os campos obrigatórios antes de continuar.');
      return null;
    }

    try {
      return renderDocumentModel({
        template,
        values,
        patient,
        professional: userProfile
      });
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const previewPdf = async () => {
    const model = buildValidatedModel();
    if (!model) return;

    setWorking(true);
    try {
      const pdf = await generateDocumentPDF({ model, template });
      revokePreview();
      setPreviewUrl(URL.createObjectURL(pdf));
    } catch (error) {
      toast.error('Não foi possível gerar a prévia: ' + error.message);
    } finally {
      setWorking(false);
    }
  };

  const issueDocument = async () => {
    const model = buildValidatedModel();
    if (!model) return;

    if (
      !window.confirm(
        'Emitir este documento? Depois da emissão, esta versão não poderá ser alterada.'
      )
    ) {
      return;
    }

    setWorking(true);

    try {
      let persistedDraftId = draftId;

      if (persistedDraftId) {
        await updateDocumentDraft(persistedDraftId, user.uid, values);
      } else {
        const created = await createDocumentDraft({
          psychologistId: user.uid,
          patientId,
          patientName: patient?.name || '',
          template,
          values
        });
        persistedDraftId = created.id;
        setDraftId(created.id);
      }

      const pdf = await generateDocumentPDF({ model, template });
      const fileName = safeDocumentFileName(
        template.label,
        patient?.name,
        values.issueDate
      );
      const file = new File([pdf], fileName, { type: 'application/pdf' });

      await issueGeneratedDocument({
        psychologistId: user.uid,
        draftId: persistedDraftId,
        template,
        patient,
        file
      });

      toast.success('Documento emitido e armazenado como versão imutável.');
      navigate('/documents', { replace: true });
    } catch (error) {
      toast.error('Não foi possível emitir: ' + error.message);
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return <div className="surface empty-state">Carregando rascunho...</div>;
  }

  return (
    <div className={styles.workspace}>
      <aside className={styles.catalog}>
        <div className={styles.catalogHeader}>
          <div className="section-kicker">Modelos</div>
          <h2>Documentos</h2>
          <p>
            Modalidades psicológicas e materiais administrativos são tratados separadamente.
          </p>
        </div>

        <div className={styles.templateList}>
          {DOCUMENT_TEMPLATES.map((item) => (
            <button
              type="button"
              key={item.id}
              className={
                item.id === templateId
                  ? styles.templateActive
                  : styles.templateButton
              }
              onClick={() => selectTemplate(item.id)}
            >
              <span>{item.label}</span>
              <small>
                {item.family === 'psychological'
                  ? 'Documento psicológico'
                  : 'Administrativo'}
                {' • v' + item.version}
              </small>
              {item.availability !== DOCUMENT_AVAILABILITY.ENABLED && (
                <LockKeyhole size={14} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className={styles.editor}>
        <header className={styles.editorHeader}>
          <div>
            <div className="section-kicker">
              {draftId ? 'Rascunho salvo' : 'Novo documento'}
            </div>
            <h1>{template?.label || 'Documento'}</h1>
            <p>{template?.guidance || template?.restriction}</p>
          </div>

          {draftId && (
            <span
              className={
                draftStatus === 'dirty'
                  ? 'badge badge-warning'
                  : draftStatus === 'error'
                    ? 'badge badge-danger'
                    : 'badge badge-success'
              }
            >
              {draftStatus === 'dirty'
                ? 'Alterações pendentes'
                : draftStatus === 'saving'
                  ? 'Salvando...'
                  : draftStatus === 'error'
                    ? 'Falha ao salvar'
                    : 'Rascunho salvo'}
            </span>
          )}
        </header>

        {template?.availability !== DOCUMENT_AVAILABILITY.ENABLED ? (
          <RestrictedTemplate template={template} />
        ) : (
          <>
            <div className={styles.notice} role="note">
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Responsabilidade profissional</strong>
                <p>
                  O PsiNote estrutura e versiona o documento; a pessoa profissional continua responsável pela pertinência, linguagem, finalidade e conteúdo emitido.
                </p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={'field ' + styles.fullWidth}>
                <label className="field-label" htmlFor="document-patient">
                  Pessoa atendida
                </label>
                <select
                  id="document-patient"
                  className="select"
                  value={patientId}
                  disabled={Boolean(draftId) || Boolean(routePatientId)}
                  onChange={(event) => {
                    revokePreview();
                    setPatientId(event.target.value);
                  }}
                >
                  <option value="">Selecione</option>
                  {patients.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {template.fields.map((field) => (
                <DocumentField
                  key={field.id}
                  field={field}
                  value={values[field.id] || ''}
                  values={values}
                  error={errors[field.id]}
                  onChange={(value) => changeValue(field.id, value)}
                />
              ))}
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="button button-secondary"
                onClick={persistDraft}
                disabled={working}
              >
                <Save size={17} aria-hidden="true" />
                {draftId ? 'Salvar rascunho' : 'Criar rascunho'}
              </button>

              <button
                type="button"
                className="button button-secondary"
                onClick={previewPdf}
                disabled={working}
              >
                <Eye size={17} aria-hidden="true" />
                Prévia do PDF
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={issueDocument}
                disabled={working}
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                Emitir versão
              </button>
            </div>

            {previewUrl && (
              <section className={styles.preview}>
                <div className={styles.previewHeader}>
                  <div>
                    <div className="section-kicker">Prévia fiel</div>
                    <h2>PDF que será emitido</h2>
                  </div>
                  <span className="badge badge-neutral">
                    {template.id} • v{template.version}
                  </span>
                </div>
                <iframe
                  title="Prévia do documento em PDF"
                  src={previewUrl}
                  className={styles.previewFrame}
                />
              </section>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function DocumentField({ field, value, values, error, onChange }) {
  const required =
    field.required
    || (
      field.requiredWhen
      && values[field.requiredWhen.field] === field.requiredWhen.equals
    );

  const hidden =
    field.requiredWhen
    && values[field.requiredWhen.field] !== field.requiredWhen.equals
    && ['serviceDate', 'startTime', 'endTime', 'followUpSince', 'frequency']
      .includes(field.id);

  if (hidden) return null;

  const fullWidth = field.type === 'textarea' || field.id === 'purpose';

  return (
    <div className={'field ' + (fullWidth ? styles.fullWidth : '')}>
      <label className="field-label" htmlFor={'doc-field-' + field.id}>
        {field.label}
        {required ? ' *' : ''}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          id={'doc-field-' + field.id}
          className="textarea"
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      ) : field.type === 'select' ? (
        <select
          id={'doc-field-' + field.id}
          className="select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={'doc-field-' + field.id}
          className="input"
          type={field.type || 'text'}
          value={value}
          placeholder={field.placeholder || ''}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
        />
      )}

      {field.help && <span className={styles.fieldHelp}>{field.help}</span>}
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

function RestrictedTemplate({ template }) {
  return (
    <div className={styles.restricted}>
      <LockKeyhole size={24} aria-hidden="true" />
      <div>
        <h2>Fluxo ainda não habilitado</h2>
        <p>{template?.restriction}</p>
        <p>
          O bloqueio é intencional: esta modalidade só será liberada quando o PsiNote tiver os dados e controles necessários para representar o processo profissional correspondente.
        </p>
      </div>
    </div>
  );
}
