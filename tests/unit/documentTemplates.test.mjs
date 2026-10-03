import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DOCUMENT_AVAILABILITY,
  DOCUMENT_TEMPLATES,
  ENABLED_DOCUMENT_TEMPLATES,
  getDocumentTemplate,
  initialDocumentValues,
  renderDocumentModel,
  validateDocumentValues
} from '../../src/domain/documentTemplates.js';

const professional = {
  name: 'Profissional Teste',
  crp: '00/00000',
  crpUf: 'MS'
};

const patient = {
  name: 'Pessoa Teste',
  cpf: '000.000.000-00'
};

describe('document template catalog', () => {
  test('only declaration and psychological report are enabled in the first professional release', () => {
    assert.deepEqual(
      ENABLED_DOCUMENT_TEMPLATES.map((item) => item.type),
      ['declaration', 'psychological_report']
    );

    const restricted = DOCUMENT_TEMPLATES.filter(
      (item) => item.availability !== DOCUMENT_AVAILABILITY.ENABLED
    );

    assert.ok(restricted.length >= 4);
    assert.ok(restricted.every((item) => item.restriction));
  });

  test('template lookup is version-aware', () => {
    const declaration = getDocumentTemplate('system.declaration', 1);
    assert.equal(declaration?.version, 1);
    assert.equal(getDocumentTemplate('system.declaration', 99), null);
  });
});

describe('declaration validation and rendering', () => {
  const template = getDocumentTemplate('system.declaration', 1);

  test('attendance declaration requires objective date/time fields', () => {
    const values = {
      ...initialDocumentValues(template),
      recipient: 'Instituição',
      purpose: 'Comprovação de comparecimento',
      statementKind: 'attendance',
      place: 'Campo Grande - MS',
      issueDate: '2026-10-03'
    };

    const invalid = validateDocumentValues(template, values);
    assert.equal(invalid.valid, false);
    assert.equal(invalid.errors.serviceDate, 'Campo obrigatório.');
    assert.equal(invalid.errors.startTime, 'Campo obrigatório.');
    assert.equal(invalid.errors.endTime, 'Campo obrigatório.');

    const valid = validateDocumentValues(template, {
      ...values,
      serviceDate: '2026-10-02',
      startTime: '14:00',
      endTime: '14:50'
    });

    assert.equal(valid.valid, true);
  });

  test('follow-up declaration uses follow-up fields instead of attendance fields', () => {
    const values = {
      ...initialDocumentValues(template),
      recipient: 'Instituição',
      purpose: 'Comprovação de acompanhamento',
      statementKind: 'follow_up',
      followUpSince: '2026-01-10',
      frequency: 'semanal',
      scheduleDescription: 'quartas-feiras, às 16h',
      place: 'Campo Grande - MS',
      issueDate: '2026-10-03'
    };

    assert.equal(validateDocumentValues(template, values).valid, true);

    const model = renderDocumentModel({
      template,
      values,
      patient,
      professional
    });

    const rendered = model.sections
      .flatMap((section) => section.paragraphs)
      .join(' ');

    assert.match(rendered, /acompanhamento psicológico desde 10\/01\/2026/);
    assert.doesNotMatch(rendered, /diagnóstico|sintoma|estado psicológico/i);
  });

  test('end time must be after start time', () => {
    const values = {
      ...initialDocumentValues(template),
      recipient: 'Instituição',
      purpose: 'Comprovação',
      statementKind: 'attendance',
      serviceDate: '2026-10-03',
      startTime: '15:00',
      endTime: '14:00',
      place: 'Campo Grande - MS',
      issueDate: '2026-10-03'
    };

    const validation = validateDocumentValues(template, values);
    assert.equal(validation.valid, false);
    assert.match(validation.errors.endTime, /posterior/);
  });
});

describe('psychological report rendering', () => {
  const template = getDocumentTemplate(
    'system.psychological-report',
    1
  );

  test('report has the five required structural sections', () => {
    const values = {
      ...initialDocumentValues(template),
      solicitant: 'Pessoa solicitante',
      purpose: 'Comunicar o trabalho desenvolvido',
      demandDescription: 'Descrição contextual da demanda.',
      procedure: 'Descrição dos procedimentos realizados.',
      analysis: 'Análise técnico-científica pertinente à finalidade.',
      conclusion: 'Conclusão e orientação pertinente.',
      place: 'Campo Grande - MS',
      issueDate: '2026-10-03'
    };

    const model = renderDocumentModel({
      template,
      values,
      patient,
      professional
    });

    assert.equal(model.title, 'RELATÓRIO PSICOLÓGICO');
    assert.deepEqual(
      model.sections.map((section) => section.heading),
      [
        'DESCRIÇÃO DA DEMANDA',
        'PROCEDIMENTO',
        'ANÁLISE',
        'CONCLUSÃO'
      ]
    );
    assert.ok(
      model.identification.some(
        ([label, value]) => label === 'CRP' && value.includes('00/00000')
      )
    );
  });

  test('restricted template cannot be rendered as if it were enabled', () => {
    const restricted = getDocumentTemplate(
      'system.psychological-assessment-report',
      1
    );

    assert.throws(
      () =>
        renderDocumentModel({
          template: restricted,
          values: {},
          patient,
          professional
        }),
      /não disponível/i
    );
  });
});
