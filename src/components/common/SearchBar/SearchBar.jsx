import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { searchPatients } from '../../../services/patientService';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
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
        setResults([]);
        return;
      }
      try {
        const patients = await searchPatients(user.uid, query);
        setResults(patients.slice(0, 10));
        setIsOpen(true);
      } catch (error) {
        console.error('Erro na busca:', error);
      }
    };
    
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, user]);

  const handleSelect = (patientId) => {
    navigate(`/patients/${patientId}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary, #f1f5f9)', borderRadius: '6px', padding: '0.3rem 0.5rem' }}>
        <Search size={20} style={{ color: 'var(--text-secondary, #475569)' }} />
        <input
          type="text"
          placeholder="Buscar pacientes, sessões, temas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          style={{ border: 'none', background: 'transparent', padding: '0.4rem', outline: 'none', flex: 1, color: 'var(--text-primary, #0f172a)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-primary, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 50 }}>
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => handleSelect(result.id)}
              style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}
            >
              <div style={{ fontWeight: '500', color: 'var(--text-primary, #0f172a)' }}>{result.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #475569)' }}>{result.email || result.phone}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
