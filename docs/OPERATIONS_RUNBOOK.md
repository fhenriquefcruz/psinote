# PsiNote — Runbook operacional, continuidade e recuperação

**Status:** procedimento proposto. Não executado, não homologado e não vinculado a dados reais.

## Inventário de dependências de recuperação

| Componente | O que preservar | Estratégia a aprovar |
|---|---|---|
| Firestore | prontuários, sessões/versionamentos, agenda, documentos/metadados, perfis e vínculos | exportação gerenciada regular para bucket privado, cópias por período, teste de importação |
| Firebase Storage | PDFs/documentos privados e metadados de objeto | backup versionado e criptografado, restore com controle de proprietário e políticas de acesso |
| Firebase Auth | identidades, fatores/autenticação e mecanismos de recuperação | plano compatível com a ferramenta oficial e requisitos de proteção de credenciais |
| Configuração Firebase | Rules, índices, claims administrativas, políticas | IaC/versionamento e evidência do estado implantado; claims requerem ferramenta privilegiada |
| GitHub Pages | pacote web produzido por commit imutável | retenção de artefato ou reconstrução verificável pelo SHA, com deploy controlado |
| Legado Supabase | documentos e URLs históricas ainda não migradas | inventário e plano de migração/revogação da Fase 9 |

**Não confundir** `git clone` com backup clínico, nem exportação Firestore com backup completo dos arquivos binários de Storage ou das contas de Auth.

## Provisionamento — somente por responsável autorizado

1. Definir proprietário operacional e aprovador de privacidade; estabelecer RPO (perda máxima tolerável de dados) e RTO (tempo máximo tolerável de recuperação), ainda não acordados.
2. Selecionar projeto Firebase/Google Cloud correto e bucket de backup **separado**, privado, criptografado e protegido contra exclusão acidental. Avaliar região, ciclo de vida, retenção/imutabilidade e custos antes de ativar.
3. Aplicar IAM de privilégio mínimo às contas de exportação e restauração. Não incluir service-account JSON, chaves de API privadas, tokens ou senhas no repositório e no CI.
4. Criar políticas agendadas de exportação Firestore e cópia/versionamento Storage, assegurando proteção dos snapshots de Auth conforme suporte da plataforma. Registro de execução: hora, projeto, buckets, status, volume e verificação, **sem IDs de pacientes**.
5. Registrar reconciliação de instantâneos Firestore/Storage/Auth por janela temporal. Não supor consistência transacional entre três serviços.
6. Registrar e revisar alertas de falha de backup, falha de autenticação e quotas. Backup sem alerta e teste não é controle aprovado.
7. Aprovar acesso ao backup, processo de restauração, política de descarte e vínculo contratual/ético de operadores.

## Exercício de recuperação obrigatório

1. Autorizar o exercício e preparar **ambiente de staging isolado**, sem usuários reais, e janela de execução.
2. Selecionar um backup e verificar existência/integridade dos manifestos de Firestore, Storage, Auth e configurações.
3. Restaurar em recursos **não produtivos**, nunca sobrescrevendo produção como primeira ação.
4. Aplicar Rules e índices correspondentes à versão restaurada. Recriar roles/claims apenas por fluxo privilegiado.
5. Testar: login sintético; tenant A não acessa tenant B; sessões e versões imutáveis; documentos privados acessíveis somente pelo proprietário; contagens e vínculos com arquivos; leitura da agenda.
6. Registrar duração real do teste, diferenças encontradas e integridade; comparar com RPO/RTO acordados. A ausência de arquivo, identidade ou regra impede aprovação.
7. Produzir evidência datada e repetir após alterações relevantes de esquema, regras ou infraestrutura.

## Recuperação de incidente real

1. Declarar incidente, reduzir superfície de escrita se preciso e preservar evidências de segurança sem conteúdo clínico em canais inseguros.
2. Identificar escopo, data/hora do último backup válido e possíveis efeitos cruzados entre Firestore, Storage e Auth.
3. Evitar restauração direta às cegas sobre produção; realizar ensaio isolado e reconciliação antes de qualquer corte.
4. Só então aprovar plano documentado de retorno/cutover, acompanhamento e validação de autorização, com responsável operacional e jurídico.
5. Executar comunicação necessária conforme requisitos profissionais, contratuais e legais aplicáveis.

## Release GitHub Pages

Pré-deploy: `npm ci` → E2E em emuladores → regressão visual → `npm run validate` → artifact `dist`. O job só executa na branch `main`. Requer configuração real de branch protection para impedir um merge não revisado.

Pós-deploy: Playwright visita URL pública e verifica interface de autenticação, erros JS e `meta[name="psinote-build"]` igual ao `github.sha` liberado.

Se o smoke pós-deploy falhar, **o código pode já estar público**. Suspender novos deploys e avaliar rollback controlado para commit previamente validado ou forward-fix. GitHub Pages **não reverte automaticamente** esta publicação, e rollback do frontend **não** desfaz migração de banco, regras, Storage ou Auth.

**Releases bloqueados:** falhas de CI, políticas de autorização, importação de dados não testada, backup sem exercício, divergências de artefato, exposição histórica de URLs públicas ou ausência de responsável por incidente.
