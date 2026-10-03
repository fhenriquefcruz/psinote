import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileClock,
  FileText,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../hooks/useAuth';
import { globalSearch } from '../../../services/searchService';
import {
  getDocumentAccessUrl,
  getDocumentById
} from '../../../services/documentService';
import {
  SAFE_SEARCH_COMMANDS,
  commandMatches,
  normalizeSearchText
} from '../../../domain/search';
import styles from './SearchBar.module.css';

const EMPTY_RESULTS = {
  patients: [],
  sessions: [],
  documents: [],
  drafts: []
};

const GROUPS = [
  ['patients', 'Pacientes'],
  ['sessions', 'Sessões'],
  ['drafts', 'Rascunhos'],
  ['documents', 'Documentos']
];

const ICONS = {
  command: Sparkles,
  patient: UserRound,
  session: Stethoscope,
  draft: FileClock,
  document: FileText
};

export default function SearchBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [queryValue, setQueryValue] = useState('');
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedQuery = normalizeSearchText(queryValue);

  const commands = useMemo(
    () =>
      SAFE_SEARCH_COMMANDS
        .filter((command) => commandMatches(queryValue, command))
        .map((command) => ({ ...command, type: 'command' })),
    [queryValue]
  );

  const entries = useMemo(
    () => [
      ...commands,
      ...results.patients,
      ...results.sessions,
      ...results.drafts,
      ...results.documents
    ],
    [commands, results]
  );

  const close = () => {
    setOpen(false);
    setQueryValue('');
    setResults(EMPTY_RESULTS);
    setActiveIndex(0);
  };

  const show = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    const keyboardShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        show();
      }

      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', keyboardShortcut);
    return () => window.removeEventListener('keydown', keyboardShortcut);
  }, [open]);

  useEffect(() => {
    if (!open || !user || normalizedQuery.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await globalSearch(user.uid, normalizedQuery);
        if (active) setResults(data);
      } catch {
        if (active) {
          setResults(EMPTY_RESULTS);
          toast.error('Não foi possível concluir a busca.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, open, user]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery, open]);

  const selectEntry = async (entry) => {
    if (!entry) return;

    if (entry.action === 'open-document') {
      try {
        const documentItem = await getDocumentById(entry.id, user.uid);
        if (!documentItem) {
          toast.error('Documento não encontrado.');
          return;
        }

        const { url, revokeAfterUse } = await getDocumentAccessUrl(
          documentItem,
          user.uid
        );

        window.open(url, '_blank', 'noopener,noreferrer');
        if (revokeAfterUse) {
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
        close();
      } catch (error) {
        toast.error('Não foi possível abrir o documento: ' + error.message);
      }
      return;
    }

    if (entry.route) {
      navigate(entry.route);
      close();
    }
  };

  const onInputKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) =>
        entries.length ? (current + 1) % entries.length : 0
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) =>
        entries.length
          ? (current - 1 + entries.length) % entries.length
          : 0
      );
    }

    if (event.key === 'Enter' && entries.length) {
      event.preventDefault();
      selectEntry(entries[activeIndex]);
    }
  };

  let runningIndex = 0;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={show}
        aria-label="Abrir busca e comandos"
      >
        <Search size={17} aria-hidden="true" />
        <span>Buscar ou executar...</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open && (
        <div
          className={styles.backdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <section
            className={styles.palette}
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
          >
            <div className={styles.searchBox}>
              <Search size={19} aria-hidden="true" />
              <input
                ref={inputRef}
                value={queryValue}
                onChange={(event) => setQueryValue(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Paciente, sessão, documento ou comando..."
                aria-label="Buscar no PsiNote"
                autoComplete="off"
              />
              {queryValue && (
                <button
                  type="button"
                  onClick={() => setQueryValue('')}
                  aria-label="Limpar busca"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className={styles.paletteBody}>
              <div className={styles.paletteIntro}>
                <div>
                  <Sparkles size={17} aria-hidden="true" />
                  <strong id="command-palette-title">Busca segura</strong>
                </div>
                <span>
                  Busca por metadados; conteúdo clínico de sessões não é pesquisado.
                </span>
              </div>

              {loading && (
                <div className={styles.loading} role="status">
                  Buscando...
                </div>
              )}

              {commands.length > 0 && (
                <ResultGroup
                  title="Comandos"
                  items={commands}
                  activeIndex={activeIndex}
                  startIndex={runningIndex}
                  onSelect={selectEntry}
                />
              )}
              {(() => {
                runningIndex += commands.length;
                return null;
              })()}

              {GROUPS.map(([key, label]) => {
                const items = results[key];
                if (!items.length) return null;

                const start = runningIndex;
                runningIndex += items.length;

                return (
                  <ResultGroup
                    key={key}
                    title={label}
                    items={items}
                    activeIndex={activeIndex}
                    startIndex={start}
                    onSelect={selectEntry}
                  />
                );
              })}

              {!loading && entries.length === 0 && normalizedQuery.length >= 2 && (
                <div className={styles.empty}>
                  Nenhum resultado encontrado nos metadados disponíveis.
                </div>
              )}
            </div>

            <footer className={styles.footer}>
              <span>↑↓ navegar</span>
              <span>Enter abrir</span>
              <span>Esc fechar</span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

function ResultGroup({
  title,
  items,
  activeIndex,
  startIndex,
  onSelect
}) {
  return (
    <section className={styles.group}>
      <h3>{title}</h3>
      <div className={styles.groupItems}>
        {items.map((item, offset) => {
          const index = startIndex + offset;
          const Icon = ICONS[item.type] || CalendarDays;
          const active = index === activeIndex;

          return (
            <button
              key={item.type + '-' + item.id}
              type="button"
              className={active ? styles.resultActive : styles.result}
              onMouseEnter={() => {}}
              onClick={() => onSelect(item)}
            >
              <span className={styles.resultIcon}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className={styles.resultText}>
                <strong>{item.label || item.title}</strong>
                <small>{item.description || item.subtitle}</small>
              </span>
              {active && <span className={styles.enterHint}>↵</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
