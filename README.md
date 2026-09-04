# Lumina Mobile

Aplicativo nativo de produtividade para iOS e Android, desenvolvido com React Native e Expo.

Native productivity app for iOS and Android, built with React Native and Expo.

## Recursos

- autenticação e navegação no aplicativo;
- tarefas e painel diário;
- registro e histórico de treinos;
- amizades privadas;
- temas claro e escuro;
- Português (Brasil) e English.

## Stack

- React Native, Expo, TypeScript e Expo Router;
- Java 21 e Spring Boot;
- PostgreSQL, Redis e RabbitMQ;
- Docker para o ambiente local.

## Desenvolvimento

Requisitos: Docker, Java 21, Node.js 22 e npm.

```bash
cp .env.example .env
docker compose up -d

cp mobile/.env.example mobile/.env
npm --prefix mobile ci
npm run start:go
```

Para validar o projeto:

```bash
cd backend && ./mvnw -B -ntp verify
cd ../mobile && npm run check
```

Consulte [mobile/README.md](mobile/README.md) para detalhes do cliente.

## Licença

[MIT](LICENSE)
