import { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { globalSearch } from '../../../services/searchService';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ patients: [], sessions: [], documents: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults({ patients: [], sessions: [], documents: [] });
        return;
      }
      setLoading(true);
      try {
        const data = await globalSearch(user.uid, query);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, user]);

  const handleSelect = (type, id) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'patient') {
      navigate(`/patients/${id}`);
    } else if (type === 'session') {
      navigate(`/sessions/${id}`);
    }
  };

  const totalResults = results.patients.length + results.sessions.length + results.documents.length;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '320px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.3rem 0.6rem',
        border: '1px solid transparent',
        transition: 'var(--transition)'
      }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar pacientes, sessões..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0.4rem 0.6rem',
            outline: 'none',
            flex: 1,
            fontSize: '0.875rem',
            color: 'var(--text-primary)'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (totalResults > 0 || loading) && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '0.5rem 0'
        }}>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Buscando...
            </div>
          ) : (
            <>
              {results.patients.length > 0 && (
                <div>
                  <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    <Users size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Pacientes
                  </div>
                  {results.patients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect('patient', p.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email || p.phone}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.sessions.length > 0 && (
                <div>
                  <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '0.3rem' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Sessões
                  </div>
                  {results.sessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => handleSelect('session', s.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{s.mainTheme || 'Sessão'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                        {s.date?.toDate?.()?.toLocaleDateString('pt-BR') || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {results.documents.length > 0 && (
                <div>
                  <div style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: '0.3rem' }}>
                    <FileText size={12} style={{ display: 'inline', marginRight: '0.3rem' }} /> Documentos
                  </div>
                  {results.documents.map(d => (
                    <div
                      key={d.id}
                      style={{
                        padding: '0.4rem 0.8rem',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onClick={() => window.open(d.fileURL, '_blank')}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
