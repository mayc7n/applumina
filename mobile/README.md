# Aplicativo Lumina / Lumina app

Cliente React Native nativo para iOS e Android, sem DOM, PWA, WebView ou dependência da interface web anterior.

Native React Native client for iOS and Android, with no DOM, PWA, WebView, or dependency on the previous web interface.

## Comandos / Commands

```bash
npm ci
npm run start:go     # Expo Go durante desenvolvimento inicial
npm start            # development build
npm run android
npm run ios
npm run check        # types, lint e testes
```

Copie `.env.example` para `.env` e configure `EXPO_PUBLIC_API_URL` com a URL HTTPS da API. A variável é pública no bundle: nunca coloque segredos nela.

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the HTTPS API URL. This value is public in the bundle; never place secrets in it.

## Organização / Organization

- `src/app`: rotas Expo Router;
- `src/components`: componentes nativos reutilizáveis;
- `src/features`: regras por funcionalidade;
- `src/lib`: cliente de API e sessão segura;
- `src/i18n`: Português (Brasil) e English;
- `src/store`: estado local;
- `src/theme`: temas claro e escuro.

Tokens de acesso ficam somente em memória. Refresh tokens ficam no Keychain/Keystore por `expo-secure-store` e são rotacionados pelo backend.
