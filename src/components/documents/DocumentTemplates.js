// src/components/documents/DocumentTemplates.js

export const DOCUMENT_TYPES = {
  CONTRACT: 'contract',
  REPORT: 'report',
  LAUDO: 'laudo',
  REFERRAL: 'referral',
  CONSENT: 'consent',
  DECLARATION: 'declaration',
  ATTESTATION: 'attestation',
  OPINION: 'opinion',
};

export const DOCUMENT_LABELS = {
  [DOCUMENT_TYPES.CONTRACT]: 'Contrato Terapêutico',
  [DOCUMENT_TYPES.REPORT]: 'Relatório Psicológico',
  [DOCUMENT_TYPES.LAUDO]: 'Laudo Psicológico',
  [DOCUMENT_TYPES.REFERRAL]: 'Encaminhamento',
  [DOCUMENT_TYPES.CONSENT]: 'Termo de Consentimento Livre e Esclarecido (TCLE)',
  [DOCUMENT_TYPES.DECLARATION]: 'Declaração',
  [DOCUMENT_TYPES.ATTESTATION]: 'Atestado Psicológico',
  [DOCUMENT_TYPES.OPINION]: 'Parecer Psicológico',
};

// Campos comuns a todos os documentos
export const COMMON_FIELDS = [
  { id: 'patientName', label: 'Nome do Paciente', type: 'text', required: true },
  { id: 'patientBirth', label: 'Data de Nascimento', type: 'date', required: true },
  { id: 'patientDocument', label: 'Documento de Identificação (RG/CPF)', type: 'text' },
  { id: 'solicitant', label: 'Solicitante (se houver)', type: 'text' },
  { id: 'purpose', label: 'Finalidade do Documento', type: 'text', required: true },
  { id: 'description', label: 'Descrição / Contexto', type: 'textarea', required: true },
  { id: 'analysis', label: 'Análise / Procedimento', type: 'textarea' },
  { id: 'conclusion', label: 'Conclusão / Recomendação', type: 'textarea' },
  { id: 'place', label: 'Local (Cidade/UF)', type: 'text', defaultValue: 'Campo Grande - MS' },
  { id: 'date', label: 'Data de Emissão', type: 'date', defaultValue: new Date().toISOString().slice(0,10) },
];

// Templates específicos com campos adicionais e texto base
export const getTemplate = (type) => {
  const templates = {
    [DOCUMENT_TYPES.CONTRACT]: {
      title: 'Contrato Terapêutico',
      fields: [
        ...COMMON_FIELDS,
        { id: 'sessionFrequency', label: 'Frequência das Sessões (ex: 1x por semana)', type: 'text', required: true },
        { id: 'sessionDuration', label: 'Duração das Sessões (minutos)', type: 'number', defaultValue: 50 },
        { id: 'fee', label: 'Valor da Sessão (R$)', type: 'number', required: true },
        { id: 'paymentTerms', label: 'Forma de Pagamento', type: 'text', defaultValue: 'Pagamento em dia' },
        { id: 'cancellationPolicy', label: 'Política de Cancelamento e Faltas', type: 'textarea' },
      ],
      baseText: `
        O presente contrato tem por objeto a prestação de serviços de psicoterapia pelo(a) psicólogo(a) ao(à) paciente,
        conforme as condições estabelecidas abaixo, em conformidade com o Código de Ética do Psicólogo e a Resolução CFP nº 06/2019.

        1. OBJETIVO: A psicoterapia visa promover o autoconhecimento e o desenvolvimento pessoal, tratando questões emocionais,
        comportamentais e relacionais.

        2. HONORÁRIOS: O valor da sessão é de R$ {fee} por {sessionDuration} minutos, a ser pago {paymentTerms}. 
        A falta de pagamento pode implicar na suspensão do atendimento.

        3. CANCELAMENTO E FALTAS: {cancellationPolicy}

        4. SIGILO: Todas as informações compartilhadas serão mantidas em sigilo, conforme a legislação e o Código de Ética.

        5. DIREITOS E DEVERES: As partes se comprometem a cumprir os termos deste contrato, podendo rescindi-lo a qualquer momento,
        mediante comunicação prévia.

        Local e data: {place}, {date}.

        Assinaturas:
        Psicólogo(a): _________________________
        Paciente: _________________________
      `,
    },
    [DOCUMENT_TYPES.REPORT]: {
      title: 'Relatório Psicológico',
      fields: [
        ...COMMON_FIELDS,
        { id: 'procedures', label: 'Procedimentos Realizados (entrevistas, testes, observações)', type: 'textarea', required: true },
        { id: 'analysisDetail', label: 'Análise dos Resultados', type: 'textarea', required: true },
        { id: 'recommendations', label: 'Recomendações / Encaminhamentos', type: 'textarea' },
      ],
      baseText: `
        Relatório Psicológico – Resolução CFP nº 06/2019

        1. IDENTIFICAÇÃO
        Paciente: {patientName} | Nasc.: {patientBirth} | Documento: {patientDocument}
        Solicitante: {solicitant}

        2. FINALIDADE
        {purpose}

        3. DESCRIÇÃO DA DEMANDA
        {description}

        4. PROCEDIMENTO
        {procedures}

        5. ANÁLISE
        {analysisDetail}

        6. CONCLUSÃO
        {conclusion}

        {recommendations}

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.LAUDO]: {
      title: 'Laudo Psicológico',
      fields: [
        ...COMMON_FIELDS,
        { id: 'procedures', label: 'Procedimentos (testes, entrevistas, observações)', type: 'textarea', required: true },
        { id: 'analysisDetail', label: 'Fundamentação Técnica', type: 'textarea', required: true },
        { id: 'conclusionDetail', label: 'Conclusão / Parecer Final', type: 'textarea', required: true },
      ],
      baseText: `
        Laudo Psicológico – Resolução CFP nº 06/2019

        1. IDENTIFICAÇÃO
        Paciente: {patientName} | Nasc.: {patientBirth} | Documento: {patientDocument}
        Solicitante: {solicitant}

        2. FINALIDADE
        {purpose}

        3. DESCRIÇÃO DA DEMANDA
        {description}

        4. PROCEDIMENTO
        {procedures}

        5. ANÁLISE E FUNDAMENTAÇÃO
        {analysisDetail}

        6. CONCLUSÃO
        {conclusionDetail}

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.REFERRAL]: {
      title: 'Encaminhamento',
      fields: [
        ...COMMON_FIELDS,
        { id: 'professional', label: 'Profissional/Serviço para Encaminhamento', type: 'text', required: true },
        { id: 'history', label: 'Histórico Resumido do Caso', type: 'textarea', required: true },
        { id: 'recommendations', label: 'Recomendações ao Profissional', type: 'textarea' },
      ],
      baseText: `
        Encaminhamento – Resolução CFP nº 06/2019

        Encaminho o(a) paciente {patientName} para atendimento com {professional}, devido à necessidade de {description}.

        Histórico: {history}

        Recomendações: {recommendations}

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.CONSENT]: {
      title: 'Termo de Consentimento Livre e Esclarecido (TCLE)',
      fields: [
        ...COMMON_FIELDS,
        { id: 'treatmentDescription', label: 'Descrição do Tratamento', type: 'textarea', required: true },
        { id: 'risksBenefits', label: 'Riscos e Benefícios', type: 'textarea', required: true },
      ],
      baseText: `
        TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO

        Eu, {patientName}, portador(a) do documento {patientDocument}, declaro que fui devidamente informado(a) sobre
        os procedimentos, objetivos e possíveis implicações do tratamento psicológico oferecido pelo(a) psicólogo(a),
        conforme descrito a seguir:

        Tratamento: {treatmentDescription}

        Riscos e Benefícios: {risksBenefits}

        Estou ciente de que posso desistir do tratamento a qualquer momento, sem prejuízo, e que todas as informações
        serão mantidas em sigilo, conforme a LGPD e o Código de Ética do Psicólogo.

        Local e data: {place}, {date}.

        Paciente: _________________________
        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.DECLARATION]: {
      title: 'Declaração',
      fields: [
        ...COMMON_FIELDS,
        { id: 'statementText', label: 'Texto da Declaração', type: 'textarea', required: true },
      ],
      baseText: `
        DECLARAÇÃO

        Declaro, para os devidos fins, que {patientName} encontra-se em acompanhamento psicológico neste consultório
        desde {date}, com frequência {sessionFrequency}. {statementText}

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.ATTESTATION]: {
      title: 'Atestado Psicológico',
      fields: [
        ...COMMON_FIELDS,
        { id: 'condition', label: 'Condição ou Aptidão', type: 'textarea', required: true },
        { id: 'period', label: 'Período (se aplicável)', type: 'text' },
      ],
      baseText: `
        ATESTADO PSICOLÓGICO

        Atesto, para os devidos fins, que {patientName} apresenta {condition}, conforme avaliação psicológica realizada
        em {date}, não apresentando impedimentos para {period}.

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
    [DOCUMENT_TYPES.OPINION]: {
      title: 'Parecer Psicológico',
      fields: [
        ...COMMON_FIELDS,
        { id: 'analysisDetail', label: 'Análise Técnica', type: 'textarea', required: true },
        { id: 'conclusionDetail', label: 'Conclusão e Recomendações', type: 'textarea', required: true },
      ],
      baseText: `
        PARECER PSICOLÓGICO

        Identificação:
        Paciente: {patientName} | Nasc.: {patientBirth} | Documento: {patientDocument}
        Solicitante: {solicitant}

        Finalidade: {purpose}

        Análise Técnica:
        {analysisDetail}

        Conclusão:
        {conclusionDetail}

        Local e data: {place}, {date}.

        Psicólogo(a): _________________________
        CRP: {crp}
      `,
    },
  };
  return templates[type] || templates[DOCUMENT_TYPES.REPORT];
};
