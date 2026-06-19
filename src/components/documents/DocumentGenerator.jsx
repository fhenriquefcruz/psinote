// src/components/documents/DocumentGenerator.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPatientById } from '../../services/patientService';
import { DOCUMENT_TYPES, DOCUMENT_LABELS, getTemplate, COMMON_FIELDS } from './DocumentTemplates';
import { generateDocumentPDF } from '../../services/documentGeneratorService';
import { toast } from 'react-toastify';
import { Download, Eye, Save, X } from 'lucide-react';
import { uploadDocument } from '../../services/documentService';

export default function DocumentGenerator({ patientId, onClose }) {
  const { user, userProfile } = useAuth();
  const [docType, setDocType] = useState(DOCUMENT_TYPES.REPORT);
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (patientId) {
      const loadPatient = async () => {
        const p = await getPatientById(patientId);
        setPatient(p);
        // Pré-preenche campos com dados do paciente
        const template = getTemplate(docType);
        const initialData = {};
        template.fields.forEach(field => {
          if (field.id === 'patientName') initialData[field.id] = p?.name || '';
          if (field.id === 'patientBirth') initialData[field.id] = p?.birthDate || '';
          if (field.id === 'patientDocument') initialData[field.id] = p?.cpf || '';
          if (field.defaultValue) initialData[field.id] = field.defaultValue;
          if (field.id === 'place') initialData[field.id] = 'Campo Grande - MS';
          if (field.id === 'date') initialData[field.id] = new Date().toISOString().slice(0,10);
        });
        setFormData(initialData);
      };
      loadPatient();
    }
  }, [patientId, docType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (saveToStorage = false) => {
    setLoading(true);
    try {
      const template = getTemplate(docType);
      const pdfBlob = await generateDocumentPDF({
        template,
        formData,
        userProfile,
        patient,
        docType,
      });
      const url = URL.createObjectURL(pdfBlob);
      // Se salvar no storage
      if (saveToStorage) {
        setSaving(true);
        const fileName = `${DOCUMENT_LABELS[docType]}_${patient?.name || 'paciente'}_${new Date().toISOString().slice(0,10)}.pdf`;
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        await uploadDocument(user.uid, file, patientId, 'documents', fileName);
        toast.success('Documento salvo no sistema!');
        setSaving(false);
      } else {
        // Baixar diretamente
        const link = document.createElement('a');
        link.href = url;
        link.download = `${DOCUMENT_LABELS[docType]}_${patient?.name || 'paciente'}_${new Date().toISOString().slice(0,10)}.pdf`;
        link.click();
        toast.success('Documento gerado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao gerar documento: ' + error.message);
    } finally {
      setLoading(false);
      setSaving(false);
    }
  };

  const template = getTemplate(docType);
  // Combinar campos específicos com os comuns
  const allFields = template.fields;

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1.5rem', 
      background: 'var(--bg-primary)', 
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Gerar Documento</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
      </div>

      {/* Seleção de Tipo */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>Tipo de Documento</label>
        <select
          value={docType}
          onChange={e => setDocType(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
        >
          {Object.entries(DOCUMENT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Campos do formulário */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        {allFields.map(field => (
          <div key={field.id} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
            <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8rem', fontWeight: 500 }}>
              {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                required={field.required}
              />
            ) : field.type === 'date' ? (
              <input
                type="date"
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                required={field.required}
              />
            ) : field.type === 'number' ? (
              <input
                type="number"
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                required={field.required}
              />
            ) : (
              <input
                type="text"
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                placeholder={field.label}
                style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleGenerate(false)}
          disabled={loading}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Download size={18} /> {loading ? 'Gerando...' : 'Baixar PDF'}
        </button>
        <button
          onClick={() => handleGenerate(true)}
          disabled={loading || saving}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'var(--success)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: loading || saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            opacity: loading || saving ? 0.7 : 1,
          }}
        >
          <Save size={18} /> {saving ? 'Salvando...' : 'Salvar e Armazenar'}
        </button>
        <button
          onClick={() => setPreview(!preview)}
          style={{
            padding: '0.6rem 1.2rem',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Eye size={18} /> {preview ? 'Ocultar Prévia' : 'Pré-visualizar'}
        </button>
      </div>

      {/* Pré-visualização (simples) */}
      {preview && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', maxHeight: '400px', overflow: 'auto' }}>
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Pré-visualização</h4>
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {template.baseText.replace(/\{(\w+)\}/g, (match, key) => formData[key] || `[${key}]`)}
          </div>
        </div>
      )}
    </div>
  );
}
