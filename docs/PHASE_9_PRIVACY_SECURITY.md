# Fase 9 — Revisão transversal de segurança, privacidade e objetivo do produto

Data da revisão: 17/11/2026. Branch: `phase-9/privacy-security-final`, derivada da Fase 8. **Este PR não representa certificação, homologação clínica nem implantação em produção.**

## 1. Objetivo norteador

PsiNote é um espaço de trabalho para a(o) psicóloga(o), centrado na continuidade do atendimento: chegada/cadastro → agenda → sessão → registro profissional versionado → documentos → acompanhamento e encerramento. Priorizar trabalho do dia, contexto longitudinal, narrativa livre com estrutura, salvamento visível, sigilo, acesso individualizado e uso efetivo em dispositivos móveis.

Fonte interna: `docs/PRODUCT_VISION.md`. O software auxilia a organização, não decide diagnóstico/conduta clínica nem substitui responsabilidade da(o) profissional.

## 2. Parecer técnico geral — nove frentes

| Frente | Estado do código em branches | Bloqueio residual |
|---|---|---|
| Dashboard e fluxo do dia | centro de ações e pendências implementado | validação real de produtividade e carga cognitiva |
| Pacientes e prontuário longitudinal | integração de perfis, sessões e documentos iniciada | classes de registro, responsáveis/representantes, encerramento formal |
| Agenda e histórico | recorrência, status e vinculação de sessão | cobertura E2E do fluxo completo, conflitos reais |
| Sessões e versões | autosave e histórico imutável em coleção separada | ensaiar offline, conflito simultâneo, recuperação de rascunho e conclusão |
| Documentos | rascunhos/versões/emissão; novos anexos privados | migração de legados; validação profissional de modelos/assinatura/fluxos |
| Isolamento | Firestore tenant-scoped, Rules testadas | rollout controlado de regras; IAM entre Storage e Firestore |
| Administração | custom claim, sem promoção privilegiada pelo browser | bootstrap e revogação confiáveis, MFA e trilha de auditoria de backend |
| Privacidade/retenção | nega hard delete, minimiza busca/logs, URLs legadas agora bloqueadas no leitor | política jurídica para retenção, requerimentos titulares, recuperação efetiva |
| Confiabilidade/release | CI, E2E/Axe/mobile/visual, SHA publicado | staging homologado, backups e rollback demonstrados, cabeçalhos CSP/HTTPS |

**Parecer:** a evolução mantém aderência à visão, mas não deve ser descrita como pronta para uso clínico em escala. A ausência de backend privilegiado, trilha de auditoria autoritativa, migração de arquivos, retenção contextual, backup testado e validação das jornadas clínicas ainda bloqueia o aceite operacional.

## 3. Correções de segurança desta fase

### Contas suspensas e perfis administrativos

- Firestore só concede inspeção administrativa de `users` a quem possui **claim `admin` e perfil ativo**.
- Storage passa a exigir proprietário autenticado **e** perfil `users/{uid}` existente e não bloqueado via `firestore.exists()/get()`.
- Sessão React reage também a atualização de ID token para atualizar claims na interface.
- Os testes de regras cobrem admin bloqueado/sem perfil e arquivo de usuário bloqueado/sem perfil.
- Regras Storage dependem da integração e permissões gerenciadas **Storage → Firestore** (banco `(default)`). É obrigatório validar configuração IAM, latência/faturamento e permissões no staging antes do rollout. Referência: https://firebase.google.com/docs/storage/security/rules-conditions

### Documentos antigos

- Removido o fallback de `getDocumentAccessUrl()` que devolvia `fileURL` pública.
- A interface sinaliza **Migração necessária** e impede abrir um legado como se fosse um documento privado.
- `isPrivateDocumentReference` exige owner exato, `storageProvider=firebase` e caminho dentro de `users/{uid}/documents/...`.
- Os novos uploads geram caminho técnico opaco, sem nome original do arquivo nem ID do paciente. O nome de exibição permanece protegido no Firestore.
- Firestore impede criação de metadados de documentos apontando para caminhos de Storage externos ou não pertencentes ao owner.
- Não foram migrados, copiados, abertos, apagados ou revogados objetos reais; links legados já expostos podem continuar acessíveis fora do PsiNote **até revogação efetiva na origem**.

## 4. Regras CFP, privacidade e prazo de guarda

Referências para confirmação profissional/jurídica:

- CFP/CRP-12, registro documental: https://transparencia.cfp.org.br/crp12/pergunta-frequente/registro-documental/
- Manual orientativo CFP (2025), guarda e acesso: https://site.cfp.org.br/wp-content/uploads/2025/11/Manual_Orientativo.pdf
- Resolução CFP 9/2024 (TDICs): https://www.legisweb.com.br/legislacao/?id=462577
- ANPD, direitos dos titulares: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares

As Resoluções CFP 1/2009 e 6/2019 tratam de guarda mínima de **cinco anos** em seus contextos. O manual CFP também indica situações de **vinte anos para prontuários de estabelecimentos que prestam serviços de saúde**, sob a Lei 13.787/2018. Prazo aplicável depende de natureza do documento, estabelecimento, outras normas, litígios e orientações da pessoa profissional responsável. **Nunca calcular elegibilidade para exclusão automaticamente a partir de um número fixo de anos.**

Política-alvo: classificar registro e documento por finalidade/contexto; definir fundamento da guarda, último registro, prazo mínimo aplicável, bloqueio por litígio, atendimento a titulares e aprovador; auditoria de decisão; descarte por backend privilegiado com retenção de evidência mínima, após backup/restore e revisão.

Não existe rotina de expurgo automático. `archive` não equivale a `delete`. Também não há exportação de prontuário pronta e homologada para exercício de direitos do titular.

## 5. Outros riscos conscientemente mantidos

1. **Trilha autoritativa:** `activities` é gravável pelo navegador e é um feed operacional, não prova forense ou assinatura de ações clínicas; eventos críticos requerem backend confiável e retenção própria.
2. **Claims, autenticação e revogação:** token ID e telas cliente não são substitutos de desativação/revogação privilegiada; definir bootstrap, remoção, MFA e resposta a comprometimento.
3. **CSP e security headers:** GitHub Pages não implementa cabeçalhos HTTP arbitrários apenas com arquivos da aplicação.
4. **Backup/restauração:** runbook existe, mas cópias reais e exercícios comprovados permanecem pendentes.
5. **Completude clínica:** formulários/registradores devem passar por revisão profissional de propósito, acesso, sigilo, assinatura e distinção entre prontuário e registro documental reservado.
6. **Jornadas reais:** testes E2E atuais não esgotam ciclo paciente → agenda → sessão → emissão.
7. **Tratadores:** consentimento/responsáveis/menores, portabilidade, instruções ao titular e comunicação em incidentes exigem desenho de produto e revisão legal.
8. **Documentos legados:** desabilitar acesso pelo PsiNote não remove URLs públicas já divulgadas; exige inventário, migração verificada e revogação na origem.

## 6. Critérios de aceitação desta entrega de código

- [x] Branch isolada sobre Fase 8 e sem deploy automático.
- [x] Política de arquivos privados e nomes opacos implementada.
- [x] Regra de conta ativa em administração e Storage implementada.
- [x] Abertura de URL pública antiga impedida na aplicação.
- [x] Casos de teste de regras e de domínio escritos.
- [ ] Pipeline completo verde no SHA final.
- [ ] Integração Storage → Firestore com IAM verificada em staging real.
- [ ] Inventário/revogação de URLs legadas concluído.
- [ ] Retenção, exportação de titular e auditoria privilegiada operacionalmente homologadas.
- [ ] Avaliação profissional e jurídica do processo real.
- [ ] Regras e infraestrutura aplicadas após plano de migração aprovado.

Próxima frente: Fase 10, homologação E2E e testes das jornadas clínicas com dados sintéticos. As pendências desta fase continuam critérios de release, mesmo quando os testes de código passarem.
