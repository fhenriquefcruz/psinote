# Fase 8 — Production Readiness

## Estado

Implementação incremental na branch `phase-8/production-readiness`, criada a partir da Fase 7. **Não significa publicação, homologação clínica nem certificação LGPD/CFP.** Os PRs anteriores continuam empilhados; não publicar ou mesclar com gates vermelhos.

## Entregas implementadas no código

1. `AppErrorBoundary` acima dos providers: tela de recuperação acessível e responsiva, referência técnica aleatória e aviso de possível perda de alterações locais ao recarregar.
2. `installGlobalDiagnostics` para `error` e `unhandledrejection`; falhas de renderização capturadas via boundary.
3. Eventos técnicos estritamente classificados com allowlists; sem `message`, `stack`, URL, query string, UID, patient ID, documentos ou texto clínico. Não há transmissão remota, `localStorage` nem persistência. Buffer volátil máximo de 20 eventos.
4. Testes de privacidade de eventos técnicos em `tests/unit/diagnostics.test.mjs`.
5. Deploy de GitHub Pages bloqueado por `npm ci`, gates E2E/Axe/mobile/visual e `npm run validate` antes da publicação.
6. Metatag pública `psinote-build` embute o SHA do release; smoke pós-deploy confere o SHA esperado, a interface de login e ausência de erros JavaScript.
7. Deploy restringido à branch `main`, inclusive acionamento manual; deploys não são cancelados uns pelos outros.

## O que os testes provam — e o que não provam

Os testes de privacidade provam que o **payload construído pelo nosso serviço** não transporta campos sensíveis; não provam que todas as bibliotecas de terceiros deixam de emitir mensagens no console ou na rede. A configuração atual não habilita coletor remoto.

O smoke pós-deploy valida interface pública e commit renderizado; **não** acessa dados clínicos reais nem confirma integridade de Firestore/Storage/Auth. Um smoke vermelho **depois** do deploy significa que a versão já pode estar visível, exigindo resposta operacional.

## Critérios operacionais obrigatórios antes do Go

- [ ] Configurar e auditar exportações automáticas de Firestore para bucket privado, com IAM mínimo, criptografia e retenção definida; registrar evidência da primeira execução.
- [ ] Cobrir Firebase Storage e Firebase Authentication, regras, índices, configurações, chaves e procedimento de restauração; documentação de backup **não equivale a backup realizado**.
- [ ] Ensaiar restauração em ambiente não produtivo isolado, com contas sintéticas, reconciliação de documentos e prova de isolamento entre profissionais.
- [ ] Formalizar proprietários de incidentes, canal de comunicação, RPO/RTO acordados, retenção e política de descarte conforme parecer jurídico/profissional.
- [ ] Ativar proteção de branch `main` com checks obrigatórios, revisão e impossibilidade de bypass não autorizado; verificar configuração real no GitHub.
- [ ] Decidir hospedagem compatível com HTTP security headers e CSP. GitHub Pages não expõe configuração arbitrária desses cabeçalhos via arquivos deste repositório.
- [ ] Validar em staging as Firestore/Storage Rules, índices e alterações de dados antes de aplicar em produção.
- [ ] Completar migração de URLs legadas públicas do Supabase para armazenamento privado e revogar links legados.
- [ ] Validar custom claims administrativas em backend confiável, LGPD, regras éticas aplicáveis e retenção.
- [ ] Realizar os testes de jornadas clínicas e acessibilidade manual das fases 9–10.
- [ ] Aprovar explicitamente o checklist de publicação das fases 11–12.

## Não objetivos

Nenhuma rotina deste PR lê, exporta, apaga, restaura ou move dados reais de pacientes. Não há criação de credenciais privilegiadas, execução de importações, configuração automática de buckets ou mudanças de regras Firebase em produção. O backup ainda é **pendência operacional**.

## Documentos de operação

Ver `docs/OPERATIONS_RUNBOOK.md` e `docs/INCIDENT_RESPONSE.md`. A arquitetura atual não possui backend confiável para ingestão centralizada de erros, nem capacidade automática de rollback transacional de Firestore + Storage + Auth + Pages.
