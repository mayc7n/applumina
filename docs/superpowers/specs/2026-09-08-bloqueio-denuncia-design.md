# Bloqueio e denúncia: design

## Objetivo

Permitir que uma pessoa bloqueie, desbloqueie e denuncie outro usuário sem revelar o bloqueio, mantendo a rede privada e impedindo novas interações enquanto o bloqueio existir.

## Escopo

- Bloqueio direcional e idempotente entre duas contas ativas.
- Ao bloquear, excluir amizade ou solicitação existente entre o par.
- Ocultar ambos os usuários entre si na busca, amigos e solicitações.
- Impedir solicitação e aceite quando existir bloqueio em qualquer direção.
- Desbloqueio não recria amizade nem solicitação.
- Denúncia com categoria fixa e detalhes opcionais limitados.
- Ação mobile confirmada, mensagens PT-BR/English e invalidação de cache por usuário.

Ficam fora deste slice: painel administrativo, anexos, moderação automática, suspensão, recurso e notificações ao denunciado.

## Modelo de dados

`user_blocks` guarda `blocker_id`, `blocked_id` e `created_at`, com chave primária no par e restrição contra autobloqueio. `user_reports` guarda identificador, denunciante, denunciado, categoria, detalhes opcionais, estado inicial `OPEN` e data. Chaves estrangeiras usam `ON DELETE CASCADE` para cumprir exclusão de conta.

RLS permite ao usuário autenticado criar, listar e excluir somente seus bloqueios. Denúncias podem ser inseridas e lidas somente pelo denunciante; o denunciado não recebe acesso. O papel operacional proprietário continua responsável por moderação futura.

## API e regras

- `POST /social/blocks` com `userId`: cria bloqueio ou mantém o existente.
- `DELETE /social/blocks/{userId}`: desbloqueia de forma idempotente.
- `GET /social/blocks`: lista usuários bloqueados pelo ator.
- `POST /social/reports` com `userId`, `category` e `details`: cria denúncia e retorna `201`.

Categorias iniciais: `HARASSMENT`, `SPAM`, `HATE`, `IMPERSONATION`, `INAPPROPRIATE_CONTENT` e `OTHER`. Detalhes aceitam até 1.000 caracteres e são normalizados; autobloqueio e autodenúncia são rejeitados.

Bloqueio adquire efeito na mesma transação: cria registro, remove vínculo social e impede novas operações. Consultas sociais excluem pares bloqueados nos dois sentidos. Erros de interação bloqueada usam resposta indistinguível de recurso ausente para não revelar quem bloqueou.

## Mobile

A tela Amigos oferece bloquear e denunciar em resultados e amizades. Bloquear exige confirmação e explica que amizade ou solicitação será removida. Usuários bloqueados aparecem em seção própria para desbloqueio. Denúncia abre formulário curto com categoria e detalhes opcionais; sucesso não expõe fluxo interno de moderação.

Todas as mutações invalidam somente `chavesAmigosUsuario(userId).base`. Ações ficam desabilitadas enquanto pendentes e erros usam cópia local traduzida.

## Verificação

- Testes unitários de regras, autorização, idempotência e mensagens não reveladoras.
- Teste PostgreSQL/Testcontainers para migration, RLS, remoção do vínculo e bloqueio bilateral de interação.
- Testes mobile para validação do formulário, ações disponíveis e isolamento das query keys.
- Gates: `./mvnw -B -ntp verify`, `npm run check`, exports Expo Android/iOS, revisão independente, staging seletivo e confirmação remota.

## Rollback

Aplicação anterior ignora as tabelas novas. Reverter código mantém dados sem afetar contratos antigos. Remoção das tabelas é etapa destrutiva separada e não faz parte deste trabalho.
