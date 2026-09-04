# Lumina Mobile

Aplicativo nativo de produtividade para iOS e Android. O projeto usa React Native com Expo no cliente e Java 21 com Spring Boot no backend. Não existe interface web nem WebView no produto móvel.

Native productivity app for iOS and Android. The client uses React Native with Expo, backed by Java 21 and Spring Boot. The mobile product has no web interface or WebView.

## Estado atual / Current status

- autenticação móvel com access token em memória e refresh token no iOS Keychain ou Android Keystore;
- restauração e rotação de sessão;
- navegação autenticada;
- painel diário;
- listagem, criação e conclusão de tarefas;
- temas claro e escuro;
- interface em Português (Brasil) e English conforme o idioma do aparelho;
- validação automatizada do backend e aplicativo.

Módulos como hábitos, metas, foco, diário, estudos, livros, notificações, recursos sociais, offline e compras serão adicionados em fatias testáveis antes da preparação final para as lojas.

## Estrutura

```text
backend/         API Spring Boot
mobile/          aplicativo Expo/React Native
infrastructure/  proxy, banco e apoio ao deploy
scripts/         backup, restauração e deploy
```

## Desenvolvimento local

Requisitos: Docker, Java 21, Node.js 22 e npm.

```bash
cp .env.example .env
docker compose up -d

cp mobile/.env.example mobile/.env
npm --prefix mobile ci
npm run start:go
```

Use uma URL HTTPS alcançável pelo aparelho em `mobile/.env`. Valores `EXPO_PUBLIC_*` ficam dentro do bundle e nunca podem conter segredos.

## Validação

```bash
cd backend && ./mvnw -B -ntp verify
cd ../mobile && npm run check
```

Consulte [mobile/README.md](mobile/README.md) para detalhes do cliente.

## Segurança

O backend web existente continua usando cookies `HttpOnly`. Somente os endpoints dedicados em `/api/auth/mobile/*` entregam o par de tokens exigido pelo aplicativo. Respostas de autenticação usam `Cache-Control: no-store`; tokens nunca devem ser registrados em logs, analytics ou URLs.

Nunca envie `.env`, chaves de assinatura, certificados, tokens ou credenciais das lojas ao Git.

## Licença

[MIT](LICENSE)
