import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDocuments, uploadDocument, deleteDocument } from '../../services/documentService';
import { getPatients } from '../../services/patientService';
import { toast } from 'react-toastify';
import { Upload, File, Trash2, Download, FolderOpen, Search } from 'lucide-react';

const CATEGORIES = [
  { value: 'contract', label: '📄 Contratos' },
  { value: 'anamnesis', label: '📋 Anamnese' },
  { value: 'terms', label: '📜 Termos' },
  { value: 'other', label: '📁 Outros' }
];

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [category, setCategory] = useState('other');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);

  const loadData = async () => {
    try {
      const [docs, pats] = await Promise.all([
        getDocuments(user.uid),
        getPatients(user.uid)
      ]);
      setDocuments(docs);
      setPatients(pats);
      setFilteredPatients(pats.filter(p => p.status === 'active'));
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.status === 'active');
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients.filter(p => p.status === 'active'));
    }
  }, [searchTerm, patients]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const name = prompt('Nome do documento:', file.name);
      if (!name) return;
      await uploadDocument(user.uid, file, selectedPatient || null, category, name);
      toast.success('Documento enviado com sucesso!');
      await loadData();
    } catch (error) {
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await deleteDocument(id, user.uid);
      toast.success('Documento excluído');
      await loadData();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (filter === 'patient' && !doc.patientId) return false;
    if (filter === 'general' && doc.patientId) return false;
    if (selectedPatient && doc.patientId !== selectedPatient) return false;
    return true;
  });

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Paciente não encontrado';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando documentos...</div>;

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>📁 Documentos</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>{documents.length} documentos armazenados</p>
        </div>
      </div>

      {/* Upload */}
      <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.8rem', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Paciente</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Digite o nome do paciente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              {searchTerm.length >= 2 && filteredPatients.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: 'var(--shadow-md)' }}>
                  {filteredPatients.map(p => (
                    <div key={p.id} onClick={() => { setSelectedPatient(p.id); setSearchTerm(p.name); setFilteredPatients([]); }} style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Categoria</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Arquivo</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} disabled={uploading} style={{ width: '100%', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
          </div>
          <div>
            <button disabled={uploading} onClick={() => document.querySelector('input[type="file"]').click()} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
              <Upload size={16} /> {uploading ? 'Enviando...' : 'Upload'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formatos suportados: PDF, JPG, PNG, DOC, DOCX</div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'all' ? 'var(--primary-light)' : 'transparent', color: filter === 'all' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'all' ? 600 : 400 }}>Todos</button>
        <button onClick={() => setFilter('patient')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'patient' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'patient' ? 'var(--primary-light)' : 'transparent', color: filter === 'patient' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'patient' ? 600 : 400 }}>De pacientes</button>
        <button onClick={() => setFilter('general')} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: filter === 'general' ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: filter === 'general' ? 'var(--primary-light)' : 'transparent', color: filter === 'general' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: filter === 'general' ? 600 : 400 }}>Gerais</button>
        {selectedPatient && (
          <button onClick={() => { setSelectedPatient(''); setSearchTerm(''); }} style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>
            Limpar filtro de paciente
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {filteredDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><FolderOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} /><p>Nenhum documento encontrado</p></div>
        ) : (
          filteredDocs.map(doc => {
            const categoryInfo = CATEGORIES.find(c => c.value === doc.category) || CATEGORIES[3];
            return (
              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
                  <File size={20} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {categoryInfo.label}
                      {doc.patientId && <span style={{ marginLeft: '0.5rem' }}>• {getPatientName(doc.patientId)}</span>}
                      <span style={{ marginLeft: '0.5rem' }}>• {(doc.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <a href={doc.fileURL} target="_blank" rel="noopener noreferrer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '0.2rem 0.4rem', textDecoration: 'none' }}><Download size={16} /></a>
                  <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem 0.4rem' }}><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
