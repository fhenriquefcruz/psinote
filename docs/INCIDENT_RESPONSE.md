# PsiNote — Resposta a incidentes de privacidade e disponibilidade

**Aplicação:** dados de atendimento psicológico são sensíveis. Este documento é base operacional e deve ser revisado por encarregado/consultoria de privacidade e profissional responsável. Não substitui avaliação jurídica.

## Severidade e gatilhos

- **Crítico:** suspeita de acesso entre tenants, documento clínico publicamente exposto, credenciais privilegiadas comprometidas ou modificação/destruição não autorizada de prontuários.
- **Alto:** indisponibilidade de autenticação, Firestore/Storage ou sessão com risco de perda de alterações clínicas.
- **Moderado:** regressão de frontend sem indício de exposição ou perda de dados, com recuperação definida.

## Fluxo de resposta

1. **Detectar e registrar:** referência aleatória de incidente, janela temporal, componente, versão de build, impacto estimado; não copiar nomes, relatos ou PDFs para logs de CI, tickets públicos ou chat.
2. **Conter:** restringir acesso e privilégios por operador autorizado, revogar tokens/links expostos quando aplicável, isolar credenciais e interromper a publicação insegura.
3. **Investigar:** determinar tenant/escopo apenas em ambiente privilegiado; preservar evidências com cadeia de custódia, acesso mínimo e retenção aprovada.
4. **Recuperar:** usar `OPERATIONS_RUNBOOK.md` com validação isolada, autorização e reconciliação; não executar purga/restauração diretamente no navegador.
5. **Comunicar:** responsável de privacidade e responsável técnico avaliam deveres de comunicação aos titulares, ANPD e profissionais conforme o caso, com prazos legais vigentes verificados na ocasião.
6. **Aprender:** publicar resumo técnico sem dados pessoais, causa raiz, ações corretivas, testes de regressão e revisão da matriz de acesso.

## Observabilidade existente e lacuna

O serviço `src/services/diagnosticsService.js` retém no máximo 20 eventos **somente em memória**, codificados por categoria, operação, rota genérica e erro em allowlist, sem telemetria remota. Recarregar a página perde esse buffer. Isso reduz riscos de vazamento, mas **não** fornece monitoramento centralizado, alertas, auditoria forense confiável ou SLA.

Um futuro coletor remoto exige backend confiável, autorização, limitação de taxa, validação de esquema no servidor, segregação de ambientes, análise de controlador/operador, política de retenção e testes de ausência de dados clínicos.

## Riscos que impedem aceite pleno

- A hospedagem atual (GitHub Pages) não fornece configuração arbitrária de cabeçalhos HTTP por este repositório. CSP via `meta` não é substituto completo de políticas via cabeçalho.
- Backup automatizado e teste de restauração ainda não foram executados.
- Documentos legados Supabase e retenção/expurgo privilegiado dependem das fases seguintes.
- A validação das operações clínicas e do ambiente de produção permanece pendente.
