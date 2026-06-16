import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { searchPatients } from '../../../services/patientService';
import { useNavigate } from 'react-router-dom';
import styles from './SearchBar.module.css';

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
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.searchBox}>
        <Search size={20} className={styles.icon} />
        <input
          type="text"
          placeholder="Buscar pacientes, sessões, temas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={styles.input}
        />
        {query && (
          <button onClick={() => setQuery('')} className={styles.clearBtn}>
            <X size={16} />
          </button>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className={styles.dropdown}>
          {results.map((result) => (
            <div
              key={result.id}
              className={styles.resultItem}
              onClick={() => handleSelect(result.id)}
            >
              <span className={styles.name}>{result.name}</span>
              <span className={styles.detail}>
                {result.email || result.phone}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
