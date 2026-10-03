import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  File,
  FileCheck2,
  FileClock,
  FilePlus2,
  FolderOpen,
  LockKeyhole,
  Upload
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import {
  getDocumentAccessUrl,
  getDocuments,
  uploadDocument
} from '../../services/documentService';
import { getDocumentDrafts } from '../../services/documentDraftService';
import { getPatients } from '../../services/patientService';
import { getDocumentTemplate } from '../../domain/documentTemplates';
import styles from './Documents.module.css';

const CATEGORIES = [
  { value: 'administrative', label: 'Administrativo' },
  { value: 'consent', label: 'Consentimento / ciência' },
  { value: 'reference', label: 'Material de referência' },
  { value: 'other', label: 'Outro' }
];

export default function Documents() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [patientFilter, setPatientFilter] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [uploadPatientId, setUploadPatientId] = useState('');
  const [category, setCategory] = useState('other');

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [docs, pendingDrafts, patientList] = await Promise.all([
        getDocuments(user.uid),
        getDocumentDrafts(user.uid),
        getPatients(user.uid)
      ]);

      setDocuments(docs);
      setDrafts(pendingDrafts);
      setPatients(patientList);
    } catch (error) {
      toast.error('Não foi possível carregar os documentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const patientName = (patientId) =>
    patients.find((item) => item.id === patientId)?.name
    || 'Paciente não encontrado';

  const filteredDocuments = useMemo(
    () =>
      documents.filter((item) => {
        if (patientFilter && item.patientId !== patientFilter) return false;
        if (kindFilter === 'issued' && item.status !== 'issued') return false;
        if (kindFilter === 'attachment' && item.kind === 'generated') return false;
        return true;
      }),
    [documents, kindFilter, patientFilter]
  );

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadDocument(
        user.uid,
        file,
        uploadPatientId || null,
        category,
        file.name
      );
      toast.success('Arquivo armazenado com segurança.');
      await loadData();
    } catch (error) {
      toast.error('Não foi possível armazenar o arquivo: ' + error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleOpenDocument = async (documentItem) => {
    try {
      const { url, revokeAfterUse } = await getDocumentAccessUrl(
        documentItem,
        user.uid
      );

      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        toast.info('Permita pop-ups para visualizar o documento.');
      }

      if (revokeAfterUse) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      toast.error('Não foi possível abrir o documento: ' + error.message);
    }
  };

  if (loading) {
    return <main className="page-shell">Carregando documentos...</main>;
  }

  const issuedCount = documents.filter((item) => item.status === 'issued').length;
  const attachmentCount = documents.length - issuedCount;

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <div className="section-kicker">Documentação</div>
          <h1 className="page-title">Documentos</h1>
          <p className="page-subtitle">
            Rascunhos, emissões imutáveis e arquivos privados em uma única área.
          </p>
        </div>

        <Link to="/documents/generate" className="button button-primary">
          <FilePlus2 size={18} aria-hidden="true" />
          Novo documento
        </Link>
      </header>

      <section className={styles.metrics} aria-label="Resumo de documentos">
        <Metric
          icon={FileClock}
          label="Rascunhos"
          value={drafts.length}
          description="Ainda editáveis"
        />
        <Metric
          icon={FileCheck2}
          label="Emitidos"
          value={issuedCount}
          description="Versões imutáveis"
        />
        <Metric
          icon={File}
          label="Anexos"
          value={attachmentCount}
          description="Arquivos armazenados"
        />
      </section>

      {drafts.length > 0 && (
        <section className="surface">
          <div className="surface-header">
            <div>
              <div className="section-kicker">Pendências</div>
              <h2 className="section-title">Rascunhos em andamento</h2>
            </div>
          </div>

          <div className={styles.draftList}>
            {drafts.map((draft) => {
              const template = getDocumentTemplate(
                draft.templateId,
                draft.templateVersion
              );

              return (
                <article key={draft.id} className={styles.draftCard}>
                  <div className={styles.documentIcon}>
                    <FileClock size={19} aria-hidden="true" />
                  </div>
                  <div className={styles.documentInfo}>
                    <strong>{template?.label || draft.templateType || 'Documento'}</strong>
                    <span>
                      {draft.patientId ? patientName(draft.patientId) : 'Sem paciente'}
                      {' • '}
                      template v{draft.templateVersion}
                    </span>
                  </div>
                  <Link
                    to={'/documents/generate?draftId=' + draft.id}
                    className="button button-secondary"
                  >
                    Continuar
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className={'surface ' + styles.uploadSection}>
        <div className="surface-header">
          <div>
            <div className="section-kicker">Arquivos externos</div>
            <h2 className="section-title">Armazenar anexo privado</h2>
          </div>
        </div>

        <div className={styles.uploadGrid}>
          <div className="field">
            <label className="field-label" htmlFor="upload-patient">Paciente</label>
            <select
              id="upload-patient"
              className="select"
              value={uploadPatientId}
              onChange={(event) => setUploadPatientId(event.target.value)}
            >
              <option value="">Documento geral</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="upload-category">Categoria</label>
            <select
              id="upload-category"
              className="select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.uploadAction}>
            <input
              ref={fileInputRef}
              className={styles.hiddenInput}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
            />
            <button
              type="button"
              className="button button-secondary"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={17} aria-hidden="true" />
              {uploading ? 'Enviando...' : 'Selecionar arquivo'}
            </button>
          </div>
        </div>

        <p className={styles.uploadHint}>
          PDF, imagens e documentos Word de até 10 MB. Arquivos novos são privados e não recebem URL pública permanente.
        </p>
      </section>

      <section>
        <div className={styles.listToolbar}>
          <div>
            <div className="section-kicker">Acervo</div>
            <h2 className="section-title">Documentos armazenados</h2>
          </div>

          <div className={styles.filters}>
            <select
              className="select"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value)}
              aria-label="Filtrar tipo de documento"
            >
              <option value="all">Todos</option>
              <option value="issued">Emitidos</option>
              <option value="attachment">Anexos</option>
            </select>

            <select
              className="select"
              value={patientFilter}
              onChange={(event) => setPatientFilter(event.target.value)}
              aria-label="Filtrar por paciente"
            >
              <option value="">Todos os pacientes</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="surface empty-state">
            <FolderOpen size={30} aria-hidden="true" />
            <span>Nenhum documento encontrado para os filtros atuais.</span>
          </div>
        ) : (
          <div className={styles.documentList}>
            {filteredDocuments.map((item) => {
              const issued = item.status === 'issued' || item.kind === 'generated';
              const template = item.templateId
                ? getDocumentTemplate(item.templateId, item.templateVersion)
                : null;

              return (
                <article key={item.id} className={'surface ' + styles.documentRow}>
                  <div className={styles.documentIcon}>
                    {issued ? (
                      <LockKeyhole size={19} aria-hidden="true" />
                    ) : (
                      <File size={19} aria-hidden="true" />
                    )}
                  </div>

                  <div className={styles.documentInfo}>
                    <div className={styles.documentTitle}>
                      <strong>{item.name}</strong>
                      <span className={'badge ' + (issued ? 'badge-success' : 'badge-neutral')}>
                        {issued ? 'Emitido' : 'Anexo'}
                      </span>
                    </div>

                    <span>
                      {item.patientId ? patientName(item.patientId) : 'Documento geral'}
                      {template ? ' • ' + template.label : ''}
                      {item.version ? ' • versão ' + item.version : ''}
                      {item.fileSize ? ' • ' + Math.max(1, Math.round(item.fileSize / 1024)) + ' KB' : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => handleOpenDocument(item)}
                  >
                    <Download size={16} aria-hidden="true" />
                    Abrir
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, description }) {
  return (
    <article className={'surface ' + styles.metric}>
      <Icon size={19} aria-hidden="true" />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </article>
  );
}
