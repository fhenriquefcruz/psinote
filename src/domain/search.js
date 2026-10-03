export const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const metadataMatches = (term, values) => {
  const needle = normalizeSearchText(term);
  if (!needle) return false;

  return values.some((value) =>
    normalizeSearchText(value).includes(needle)
  );
};

export const commandMatches = (term, command) => {
  const needle = normalizeSearchText(term);
  if (!needle) return true;

  return metadataMatches(needle, [
    command.label,
    command.description,
    ...(command.keywords || [])
  ]);
};

export const SAFE_SEARCH_COMMANDS = [
  {
    id: 'new-patient',
    label: 'Novo paciente',
    description: 'Cadastrar uma nova pessoa atendida',
    route: '/patients/new',
    keywords: ['paciente', 'cadastrar', 'novo']
  },
  {
    id: 'new-session',
    label: 'Nova sessão',
    description: 'Iniciar um novo registro de atendimento',
    route: '/sessions/new',
    keywords: ['sessao', 'atendimento', 'registro']
  },
  {
    id: 'agenda',
    label: 'Abrir agenda',
    description: 'Ver dia, semana, mês ou lista de atendimentos',
    route: '/agenda',
    keywords: ['agenda', 'calendario', 'consulta']
  },
  {
    id: 'new-document',
    label: 'Novo documento',
    description: 'Criar um rascunho de documento psicológico',
    route: '/documents/generate',
    keywords: ['documento', 'declaracao', 'relatorio']
  },
  {
    id: 'documents',
    label: 'Abrir documentos',
    description: 'Ver rascunhos, documentos emitidos e anexos',
    route: '/documents',
    keywords: ['documentos', 'arquivos', 'rascunhos']
  },
  {
    id: 'patients',
    label: 'Abrir pacientes',
    description: 'Acessar a lista de pessoas atendidas',
    route: '/patients',
    keywords: ['pacientes', 'pessoas']
  }
];
