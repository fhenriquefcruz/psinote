export const DOCUMENT_FAMILIES = {
  PSYCHOLOGICAL: 'psychological',
  ADMINISTRATIVE: 'administrative'
};

export const DOCUMENT_AVAILABILITY = {
  ENABLED: 'enabled',
  RESTRICTED: 'restricted',
  FUTURE: 'future'
};

const declarationV1 = {
  id: 'system.declaration',
  version: 1,
  family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
  type: 'declaration',
  label: 'Declaração',
  title: 'DECLARAÇÃO',
  availability: DOCUMENT_AVAILABILITY.ENABLED,
  regulatoryBasis: [
    'Resolução CFP nº 06/2019',
    'Manual Orientativo de Registro e Elaboração de Documentos Psicológicos, CFP, 2025'
  ],
  guidance:
    'Documento objetivo para comprovar comparecimento, acompanhamento e informações de tempo/dias/horários. Não deve registrar sintomas, situações ou estados psicológicos.',
  fields: [
    {
      id: 'recipient',
      label: 'Destinatário / instituição',
      type: 'text',
      required: true
    },
    {
      id: 'purpose',
      label: 'Finalidade específica',
      type: 'text',
      required: true,
      help: 'Evite finalidades genéricas. Registre por que o documento foi solicitado.'
    },
    {
      id: 'statementKind',
      label: 'O que será declarado',
      type: 'select',
      required: true,
      options: [
        { value: 'attendance', label: 'Comparecimento a atendimento' },
        { value: 'follow_up', label: 'Acompanhamento psicológico' }
      ]
    },
    {
      id: 'serviceDate',
      label: 'Data do atendimento',
      type: 'date',
      requiredWhen: { field: 'statementKind', equals: 'attendance' }
    },
    {
      id: 'startTime',
      label: 'Horário inicial',
      type: 'time',
      requiredWhen: { field: 'statementKind', equals: 'attendance' }
    },
    {
      id: 'endTime',
      label: 'Horário final',
      type: 'time',
      requiredWhen: { field: 'statementKind', equals: 'attendance' }
    },
    {
      id: 'followUpSince',
      label: 'Acompanhamento desde',
      type: 'date',
      requiredWhen: { field: 'statementKind', equals: 'follow_up' }
    },
    {
      id: 'frequency',
      label: 'Frequência do acompanhamento',
      type: 'text',
      requiredWhen: { field: 'statementKind', equals: 'follow_up' },
      placeholder: 'Ex.: semanal'
    },
    {
      id: 'scheduleDescription',
      label: 'Dias e horários, quando necessário',
      type: 'text',
      required: false,
      placeholder: 'Ex.: quartas-feiras, das 16h às 17h'
    },
    {
      id: 'place',
      label: 'Local',
      type: 'text',
      required: true
    },
    {
      id: 'issueDate',
      label: 'Data de emissão',
      type: 'date',
      required: true
    }
  ]
};

const psychologicalReportV1 = {
  id: 'system.psychological-report',
  version: 1,
  family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
  type: 'psychological_report',
  label: 'Relatório Psicológico',
  title: 'RELATÓRIO PSICOLÓGICO',
  availability: DOCUMENT_AVAILABILITY.ENABLED,
  regulatoryBasis: [
    'Resolução CFP nº 06/2019',
    'Manual Orientativo de Registro e Elaboração de Documentos Psicológicos, CFP, 2025'
  ],
  guidance:
    'Comunicação técnico-científica sobre a atuação profissional, de caráter informativo e não diagnóstico. Não corresponde à transcrição literal das sessões.',
  fields: [
    {
      id: 'solicitant',
      label: 'Solicitante',
      type: 'text',
      required: true
    },
    {
      id: 'purpose',
      label: 'Finalidade',
      type: 'textarea',
      required: true
    },
    {
      id: 'demandDescription',
      label: 'Descrição da demanda',
      type: 'textarea',
      required: true
    },
    {
      id: 'procedure',
      label: 'Procedimento',
      type: 'textarea',
      required: true
    },
    {
      id: 'analysis',
      label: 'Análise',
      type: 'textarea',
      required: true
    },
    {
      id: 'conclusion',
      label: 'Conclusão',
      type: 'textarea',
      required: true
    },
    {
      id: 'validity',
      label: 'Validade / contexto temporal, quando aplicável',
      type: 'textarea',
      required: false
    },
    {
      id: 'place',
      label: 'Local',
      type: 'text',
      required: true
    },
    {
      id: 'issueDate',
      label: 'Data de emissão',
      type: 'date',
      required: true
    }
  ]
};

const restrictedTemplates = [
  {
    id: 'system.psychological-attestation',
    version: 1,
    family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
    type: 'psychological_attestation',
    label: 'Atestado Psicológico',
    availability: DOCUMENT_AVAILABILITY.RESTRICTED,
    restriction:
      'Exige contexto explícito de avaliação psicológica e conclusão técnica adequada. O PsiNote ainda não modela esse processo de forma suficiente.'
  },
  {
    id: 'system.psychological-assessment-report',
    version: 1,
    family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
    type: 'psychological_assessment_report',
    label: 'Laudo Psicológico',
    availability: DOCUMENT_AVAILABILITY.RESTRICTED,
    restriction:
      'É resultante de processo de avaliação psicológica. Será habilitado somente quando o PsiNote modelar avaliação, procedimentos, referências e requisitos específicos.'
  },
  {
    id: 'system.multidisciplinary-report',
    version: 1,
    family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
    type: 'multidisciplinary_report',
    label: 'Relatório Multiprofissional',
    availability: DOCUMENT_AVAILABILITY.RESTRICTED,
    restriction:
      'Exige autoria multiprofissional e separação das contribuições técnicas. O modelo de coautoria ainda não está implementado.'
  },
  {
    id: 'system.psychological-opinion',
    version: 1,
    family: DOCUMENT_FAMILIES.PSYCHOLOGICAL,
    type: 'psychological_opinion',
    label: 'Parecer Psicológico',
    availability: DOCUMENT_AVAILABILITY.RESTRICTED,
    restriction:
      'É resposta técnica a uma consulta/questão-problema e não decorre da intervenção psicológica realizada pela parecerista. Requer workflow próprio.'
  },
  {
    id: 'system.service-agreement',
    version: 1,
    family: DOCUMENT_FAMILIES.ADMINISTRATIVE,
    type: 'service_agreement',
    label: 'Contrato / Acordo de Prestação de Serviço',
    availability: DOCUMENT_AVAILABILITY.FUTURE,
    restriction:
      'Documento administrativo/contratual. Não é tratado como modalidade de documento psicológico e exige revisão jurídica/contextual própria.'
  },
  {
    id: 'system.consent',
    version: 1,
    family: DOCUMENT_FAMILIES.ADMINISTRATIVE,
    type: 'consent',
    label: 'Consentimento / Ciência',
    availability: DOCUMENT_AVAILABILITY.FUTURE,
    restriction:
      'Consentimento é fluxo próprio de ciência, versão e aceite. Não deve ser reduzido a um PDF genérico.'
  }
];

export const DOCUMENT_TEMPLATES = [
  declarationV1,
  psychologicalReportV1,
  ...restrictedTemplates
];

export const ENABLED_DOCUMENT_TEMPLATES = DOCUMENT_TEMPLATES.filter(
  (template) => template.availability === DOCUMENT_AVAILABILITY.ENABLED
);

export const getDocumentTemplate = (templateId, version = null) =>
  DOCUMENT_TEMPLATES.find(
    (template) =>
      template.id === templateId
      && (version == null || template.version === version)
  ) || null;

const requiredFor = (field, values) => {
  if (field.required) return true;
  if (!field.requiredWhen) return false;

  return values[field.requiredWhen.field] === field.requiredWhen.equals;
};

export const initialDocumentValues = (template, context = {}) => {
  const today = new Date().toISOString().slice(0, 10);

  return Object.fromEntries(
    template.fields.map((field) => {
      let value = '';

      if (field.id === 'place') value = context.place || '';
      if (field.id === 'issueDate') value = today;
      if (field.id === 'statementKind') value = 'attendance';

      return [field.id, value];
    })
  );
};

export const validateDocumentValues = (template, values) => {
  const errors = {};

  for (const field of template.fields) {
    if (!requiredFor(field, values)) continue;

    const value = values[field.id];
    if (value == null || String(value).trim() === '') {
      errors[field.id] = 'Campo obrigatório.';
    }
  }

  if (
    template.type === 'declaration'
    && values.statementKind === 'attendance'
    && values.startTime
    && values.endTime
    && values.endTime <= values.startTime
  ) {
    errors.endTime = 'O horário final deve ser posterior ao inicial.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

const formatDate = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);

  const [, year, month, day] = match;
  return day + '/' + month + '/' + year;
};

const professionalIdentification = (professional) => {
  const crp = [professional?.crp, professional?.crpUf]
    .filter(Boolean)
    .join(' - ');

  return {
    name: professional?.name || 'Profissional não informado',
    registration: crp || 'Registro profissional não informado'
  };
};

const renderDeclaration = ({ values, patient, professional }) => {
  const subjectName = patient?.name || 'Pessoa atendida';
  const subjectDocument = patient?.cpf
    ? ', CPF ' + patient.cpf
    : '';

  let statement;

  if (values.statementKind === 'follow_up') {
    const schedule = values.scheduleDescription
      ? ', ' + values.scheduleDescription
      : '';

    statement =
      subjectName
      + subjectDocument
      + ' encontra-se em acompanhamento psicológico desde '
      + formatDate(values.followUpSince)
      + ', com frequência '
      + values.frequency
      + schedule
      + '.';
  } else {
    statement =
      subjectName
      + subjectDocument
      + ' compareceu a atendimento psicológico em '
      + formatDate(values.serviceDate)
      + ', das '
      + values.startTime
      + ' às '
      + values.endTime
      + '.';
  }

  return {
    title: 'DECLARAÇÃO',
    subtitle: null,
    identification: [],
    sections: [
      {
        heading: null,
        paragraphs: [
          'Finalidade: ' + values.purpose + '.',
          'Destinatário: ' + values.recipient + '.',
          statement
        ]
      }
    ],
    closing: {
      place: values.place,
      issueDate: formatDate(values.issueDate),
      professional: professionalIdentification(professional)
    }
  };
};

const renderPsychologicalReport = ({ values, patient, professional }) => ({
  title: 'RELATÓRIO PSICOLÓGICO',
  subtitle: null,
  identification: [
    ['Pessoa atendida', patient?.name || 'Não informado'],
    ['Solicitante', values.solicitant],
    ['Finalidade', values.purpose],
    ['Autoria', professionalIdentification(professional).name],
    ['CRP', professionalIdentification(professional).registration]
  ],
  sections: [
    {
      heading: 'DESCRIÇÃO DA DEMANDA',
      paragraphs: [values.demandDescription]
    },
    {
      heading: 'PROCEDIMENTO',
      paragraphs: [values.procedure]
    },
    {
      heading: 'ANÁLISE',
      paragraphs: [values.analysis]
    },
    {
      heading: 'CONCLUSÃO',
      paragraphs: [values.conclusion]
    },
    ...(values.validity
      ? [{ heading: 'VALIDADE', paragraphs: [values.validity] }]
      : [])
  ],
  closing: {
    place: values.place,
    issueDate: formatDate(values.issueDate),
    professional: professionalIdentification(professional)
  }
});

export const renderDocumentModel = ({
  template,
  values,
  patient,
  professional
}) => {
  if (!template || template.availability !== DOCUMENT_AVAILABILITY.ENABLED) {
    throw new Error('Template não disponível para emissão.');
  }

  const validation = validateDocumentValues(template, values);
  if (!validation.valid) {
    const error = new Error('Existem campos obrigatórios pendentes.');
    error.validationErrors = validation.errors;
    throw error;
  }

  if (template.type === 'declaration') {
    return renderDeclaration({ values, patient, professional });
  }

  if (template.type === 'psychological_report') {
    return renderPsychologicalReport({ values, patient, professional });
  }

  throw new Error('Renderizador não disponível para este template.');
};
