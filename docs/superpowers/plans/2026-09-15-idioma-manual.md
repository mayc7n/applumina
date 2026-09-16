# Idioma Manual Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a pessoa escolha Português (Brasil) ou English na Conta e aplicar essa escolha imediatamente em todo o Mobile.

**Architecture:** A preferência autenticada será lida do usuário no Zustand e persistida pelo `PATCH /users/me` já existente. `useIdioma` usará `usuario.locale` quando válido e manterá o idioma do aparelho somente como fallback; a tela Conta fará atualização otimista com rollback em caso de erro.

**Tech Stack:** React Native, Expo Router, Zustand, React Native Pressable, Jest/jest-expo, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-15-idioma-e-miniaturas-calendario-design.md`

## Global Constraints

- Os valores aceitos pelo aplicativo são somente `pt-BR` e `en`.
- A preferência será salva em `users.locale` por `PATCH /users/me`.
- A interface e mensagens de erro devem continuar disponíveis em PT-BR e English.
- A alteração não cria dependência nova nem altera o backend web.
- O seletor deve expor papel/estado de acessibilidade e ficar desabilitado durante o salvamento.

### Task 1: Tipos, estado global e resolução do idioma

**Files:**
- Modify: `mobile/src/types/api.ts`
- Modify: `mobile/src/store/auth-store.ts`
- Modify: `mobile/src/i18n/idioma.ts`
- Test: `mobile/src/i18n/idioma.test.ts`

**Interfaces:**
- Produces `type IdiomaApp = "pt-BR" | "en"`.
- Produces `atualizarIdioma: (idioma: IdiomaApp) => void` in the auth store.
- `useIdioma()` returns `{ idioma: IdiomaApp, traduzir }` and prioritizes the authenticated user's `locale`.

- [ ] **Step 1: Write the failing tests**

Add tests covering the resolver pure function and the hook contract:

```ts
test("prioriza a preferência en do usuário sobre o idioma do aparelho", () => {
  expect(resolverIdioma("en", "pt-BR")).toBe("en");
});

test("usa o idioma do aparelho quando não há preferência válida", () => {
  expect(resolverIdioma(undefined, "en-US")).toBe("en");
  expect(resolverIdioma(undefined, "pt-BR")).toBe("pt-BR");
});

test("usa o fallback do aparelho para locale desconhecido", () => {
  expect(resolverIdioma("fr", "en-US")).toBe("en");
});
```

Export `resolverIdioma(preferencia: string | undefined, idiomaDispositivo: string | undefined): IdiomaApp` from `idioma.ts` so the behavior is deterministic and testable without a device. An invalid stored preference is treated as absent and uses the device fallback.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --runInBand src/i18n/idioma.test.ts`

Expected: FAIL because `resolverIdioma` and the explicit user-locale path do not exist.

- [ ] **Step 3: Implement the minimum state and resolver**

In `types/api.ts`, add:

```ts
export type IdiomaApp = "pt-BR" | "en";
```

Extend `UpdateProfileInput` with `locale?: IdiomaApp`. In `auth-store.ts`, add `atualizarIdioma` to `AuthState` and update only the current user:

```ts
atualizarIdioma: (idioma) => definir((atual) => ({
  usuario: atual.usuario ? { ...atual.usuario, locale: idioma } : null,
})),
```

Keep all other auth state unchanged. In `idioma.ts`, read `usuario?.locale` from `useArmazenamentoAutenticacao`, map only `en` and `en-*` to `"en"`, map `pt` and `pt-*` to `"pt-BR"`, and use the existing device fallback otherwise. Keep translation lookup and interpolation unchanged.

- [ ] **Step 4: Run the focused tests and typecheck**

Run: `npm test -- --runInBand src/i18n/idioma.test.ts` and `npm run typecheck`

Expected: PASS; no translation key behavior changes.

- [ ] **Step 5: Commit the language state foundation**

```bash
git add mobile/src/types/api.ts mobile/src/store/auth-store.ts mobile/src/i18n/idioma.ts mobile/src/i18n/idioma.test.ts
git commit -m "feat(mobile): prioriza idioma salvo da conta"
```

### Task 2: Seletor acessível e persistência na Conta

**Files:**
- Create: `mobile/src/components/account/language-selector.tsx`
- Create: `mobile/src/components/account/language-selector.test.tsx`
- Modify: `mobile/src/app/(app)/account.tsx`
- Modify: `mobile/src/i18n/idioma.ts`

**Interfaces:**
- `LanguageSelectorProps` consumes `idioma: IdiomaApp`, `salvando: boolean`, and `onChange: (idioma: IdiomaApp) => void`.
- `LanguageSelector` renders two mutually exclusive Pressables with `accessibilityRole="radio"` and `accessibilityState.selected`.

- [ ] **Step 1: Write the failing component test**

Mock the theme and render `LanguageSelector` with `idioma="pt-BR"`. Assert that the Portuguese option is selected, English is not selected, both labels are present, and pressing English calls `onChange("en")`. Assert that `salvando` disables both options.

- [ ] **Step 2: Run the focused component test and verify it fails**

Run: `npm test -- --runInBand src/components/account/language-selector.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the selector and translated labels**

Create the component with `Pressable`, theme colors, a visible selected fill/border, `hitSlop`, and no animation beyond the existing pressed style. Use translated labels supplied by the parent so the component does not own i18n state. Add PT-BR/English keys for the two options, success, and failure messages.

- [ ] **Step 4: Integrate optimistic save with rollback**

In `account.tsx`, replace the current language `ConfiguracaoConta` row with `LanguageSelector`. Capture the previous effective `idioma`, call `atualizarIdioma(novoIdioma)` immediately, then call `apiUsuarios.atualizarPerfil({ locale: novoIdioma })`. On success, keep the optimistic `usuario.locale` and show the translated success message. On error, call `atualizarIdioma(idiomaAnterior)` and show the translated error with `Alert.alert`. Keep a single `idiomaSalvando` flag and ignore a second change while it is true.

- [ ] **Step 5: Run focused tests and update the account layout contract**

Extend `account-layout.test.tsx` to assert `LanguageSelector` appears inside the preferences section before privacy. Run:

```bash
npm test -- --runInBand src/components/account/language-selector.test.tsx src/components/ui/account-layout.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run the complete mobile gate**

Run from `mobile/`: `npm run check`

Expected: typecheck, lint, and all Jest suites pass. Existing lint warnings may remain warnings only.

- [ ] **Step 7: Commit the language selector**

```bash
git add mobile/src/components/account/language-selector.tsx mobile/src/components/account/language-selector.test.tsx mobile/src/app/\(app\)/account.tsx mobile/src/i18n/idioma.ts mobile/src/components/ui/account-layout.test.tsx
git commit -m "feat(mobile): permita escolher o idioma"
```

## Rollback

Revert the two language commits. The server-side `locale` value remains harmless for older clients, and the device-language fallback remains available.
