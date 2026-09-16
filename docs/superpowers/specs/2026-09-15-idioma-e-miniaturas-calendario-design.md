# Idioma manual e miniaturas no calendário: design

## Objetivo

Permitir que a pessoa escolha Português (Brasil) ou English no aplicativo e tornar visíveis, no calendário privado de treinos, as fotos associadas aos dias registrados.

## Escopo

- Seletor acessível de idioma na tela Conta, com troca imediata da interface.
- Persistência da escolha em `users.locale`, usando o endpoint de perfil já existente.
- Fallback para o idioma do aparelho quando a pessoa ainda não possui preferência salva.
- Inclusão de uma referência protegida da mídia no resumo do calendário.
- Miniatura arredondada no dia que possui foto, mantendo o número legível e o toque abrindo o detalhe do dia.
- Fallback para o indicador atual quando a miniatura não puder carregar.

Ficam fora deste slice: novos idiomas, tradução do backend, feed social, URLs públicas de mídia, mudança de privacidade e redesenho do calendário.

## Idioma e estado

`useIdioma` passa a priorizar `usuario.locale` quando a sessão estiver autenticada. Os valores aceitos pelo aplicativo são `pt-BR` e `en`; qualquer outro valor cai em `pt-BR` ou no fallback atual do aparelho, conforme o estado da sessão.

A tela Conta apresenta duas opções mutuamente exclusivas. A mudança atualiza o estado do usuário imediatamente para que todas as telas re-renderizem, envia `PATCH /users/me` com `locale` e restaura a opção anterior se a requisição falhar. Enquanto salva, as opções ficam desabilitadas. A cópia de rótulos, estados de acessibilidade e erro permanece traduzida nos dois idiomas.

## Miniaturas e privacidade

O endpoint autenticado `GET /workouts/calendar` continua retornando somente os treinos da pessoa autenticada. Cada resumo de treino poderá indicar o caminho da mídia já existente; o backend não fornecerá URL pública nem dados de mídia para outra conta.

No cliente, o calendário escolhe a primeira mídia disponível do dia e renderiza uma imagem pequena na célula, junto ao número. A imagem usa a requisição autenticada existente; se não houver token, a resposta falhar ou o conteúdo não for carregável, a célula mantém o marcador de foto atual. O rótulo acessível continuará informando que o dia possui foto.

## Contratos e arquivos

- `mobile/src/i18n/idioma.ts`: preferência persistida e seleção efetiva do idioma.
- `mobile/src/app/(app)/account.tsx`: controle visual e salvamento da escolha.
- `mobile/src/types/api.ts`: tipos de locale e resumo de mídia.
- `mobile/src/components/workouts/workout-calendar.tsx`: miniatura e fallback visual.
- `mobile/src/app/(app)/(tabs)/workouts.tsx`: passagem do contexto autenticado necessário.
- `backend/src/main/java/com/lumina/api/dto/WorkoutCalendarDayResponse.java`: extensão compatível do resumo.
- `backend/src/main/java/com/lumina/application/service/WorkoutService.java`: seleção da mídia pertencente ao usuário.

## Verificação

- Testes mobile para idioma do aparelho, preferência da conta, troca imediata, rollback e renderização da miniatura/fallback.
- Testes backend para resumo do calendário com mídia e isolamento por usuário.
- `npm run check` no diretório `mobile`.
- `./mvnw -B -ntp verify` no diretório `backend`.
- Exports Expo Android e iOS e `git diff --check`.

## Rollback

A extensão do DTO é compatível com clientes antigos, que ignoram o campo novo. Reverter o cliente remove o seletor e a renderização sem apagar a preferência `locale` nem as mídias existentes. Não haverá migration destrutiva.
