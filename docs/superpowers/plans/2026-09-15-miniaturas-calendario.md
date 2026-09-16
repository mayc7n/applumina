# Miniaturas do Calendário Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar no calendário privado uma miniatura da primeira foto disponível de cada dia de treino, sem tornar a mídia pública.

**Architecture:** O endpoint autenticado de calendário continuará limitado ao usuário autenticado, mas cada resumo receberá um caminho relativo para o endpoint privado `/workouts/{id}/moment` quando houver mídia pronta. O cliente exibirá a imagem com o access token em header, mantendo o número do dia e usando o ícone atual como fallback de ausência/erro.

**Tech Stack:** Spring Boot/JPA, PostgreSQL/Testcontainers, React Native, Expo Image, Jest/jest-expo, TypeScript.

**Spec:** `docs/superpowers/specs/2026-09-15-idioma-e-miniaturas-calendario-design.md`

## Global Constraints

- O calendário retorna somente treinos do usuário autenticado.
- Não criar URL pública, token em query string ou alteração de privacidade.
- Usar somente mídia `READY` cujo conteúdo seja imagem.
- A primeira mídia disponível do dia é a primeira na ordem atual dos treinos; sem mídia, preservar o indicador atual.
- O número do dia deve continuar legível e a área de toque/accessibilityLabel não pode ser removida.
- Não adicionar dependência nova; `expo-image` já está instalado.

### Task 1: Contrato e seleção segura da mídia no backend

**Files:**
- Modify: `backend/src/main/java/com/lumina/api/dto/WorkoutCalendarDayResponse.java`
- Modify: `backend/src/main/java/com/lumina/application/service/WorkoutService.java`
- Test: `backend/src/test/java/com/lumina/application/service/WorkoutServiceTest.java`

**Interfaces:**
- `WorkoutCalendarDayResponse.WorkoutSummary` gains `String momentPath`.
- `momentPath` is either `null` or `/workouts/{workoutId}/moment`.
- `WorkoutService.calendar(userId, from, to)` remains the same public method and returns only owner-scoped media.

- [ ] **Step 1: Write the failing backend tests**

Extend `buildsCalendarDaysFromInclusiveRangeWithMultipleWorkouts` with a `WorkoutMedia` in `READY` state and `contentType="image/jpeg"` belonging to `first`. Mock `workoutMediaRepository.findByWorkoutIdInAndUserId(...)` to return it and assert:

```java
assertThat(days.get(0).workouts().get(0).momentPath())
    .isEqualTo("/workouts/" + first.getId() + "/moment");
assertThat(days.get(0).workouts().get(1).momentPath()).isNull();
```

Add a second test with `PENDING`, `FAILED`, and `text/plain` media and assert every `momentPath()` is null and `hasMoment()` is false. The repository query must still receive the authenticated `userId`.

- [ ] **Step 2: Run the focused backend tests and verify they fail**

Run from `backend/`: `./mvnw -B -ntp -Dtest=WorkoutServiceTest test`

Expected: FAIL because `momentPath` does not exist and the service only produces the boolean `hasMoment`.

- [ ] **Step 3: Implement the minimum DTO/service mapping**

Add `momentPath` to the nested record. In `WorkoutService`, build a `Map<UUID, WorkoutMedia>` from `findByWorkoutIdInAndUserId(...)`, filtering `status == READY` and `contentType.startsWith("image/")`. Pass that map into `toCalendarDay`, set `hasMoment` from the map, and set each summary path from the matching workout ID:

```java
String momentPath = mediaByWorkout.containsKey(workout.getId())
    ? "/workouts/" + workout.getId() + "/moment"
    : null;
```

Keep the existing workout ordering and totals. An empty workout-ID list must not issue a media query if the current repository/database setup cannot accept an empty `IN` parameter; use an empty map instead.

- [ ] **Step 4: Run the focused backend tests and verify they pass**

Run: `./mvnw -B -ntp -Dtest=WorkoutServiceTest test`

Expected: PASS, including owner-scoped repository verification.

- [ ] **Step 5: Commit the backend calendar contract**

```bash
git add backend/src/main/java/com/lumina/api/dto/WorkoutCalendarDayResponse.java backend/src/main/java/com/lumina/application/service/WorkoutService.java backend/src/test/java/com/lumina/application/service/WorkoutServiceTest.java
git commit -m "feat(calendario): exponha caminho seguro da foto"
```

### Task 2: Tipos, autenticazione da imagem e miniatura no calendário

**Files:**
- Modify: `mobile/src/types/api.ts`
- Modify: `mobile/src/components/workouts/workout-calendar.tsx`
- Modify: `mobile/src/app/(app)/(tabs)/workouts.tsx`
- Create: `mobile/src/components/workouts/workout-calendar.test.tsx`

**Interfaces:**
- `WorkoutCalendarItem.momentPath?: string`.
- `WorkoutCalendarProps` consumes `token?: string`.
- `WorkoutCalendar` uses `process.env.EXPO_PUBLIC_API_URL` plus `momentPath` and sends `Authorization: Bearer <token>` only through the image source headers.

- [ ] **Step 1: Write the failing mobile render tests**

Mock `expo-image` and `lucide-react-native`, render a calendar day whose first workout has `momentPath`, and assert an image source points to `${EXPO_PUBLIC_API_URL}/workouts/<id>/moment` with the Bearer header. Assert the day number and accessible calendar button remain. Render a day without `momentPath` and assert the existing `ImageIcon` fallback is present.

- [ ] **Step 2: Run the focused test and verify it fails**

Run from `mobile/`: `npm test -- --runInBand src/components/workouts/workout-calendar.test.tsx`

Expected: FAIL because the type/property and image render do not exist.

- [ ] **Step 3: Implement the authenticated image source and fallback**

Add `momentPath?: string` to `WorkoutCalendarItem`. In the calendar component, find the first `workout` with `momentPath`. Render `expo-image` at approximately `22x22` with a rounded crop, `cachePolicy="memory-disk"`, and `testID` based on the date. Keep the day number above/adjacent to the image. If `token` or API URL is unavailable, or the image fires `onError`, render the existing Lucide image icon instead. Do not add the token to the URL or accessibility text.

- [ ] **Step 4: Pass the current access token from the workout screen**

Import `obterTokenAcesso` from `mobile/src/lib/auth/session` in the workout tab and pass `token={obterTokenAcesso()}` to `WorkoutCalendar`. Keep query keys, calendar selection, day sheet, and navigation unchanged.

- [ ] **Step 5: Run focused mobile tests and typecheck**

Run:

```bash
npm test -- --runInBand src/components/workouts/workout-calendar.test.tsx src/components/ui/workouts-layout.test.tsx
npm run typecheck
```

Expected: PASS with the existing calendar navigation tests unchanged.

- [ ] **Step 6: Run complete gates**

Run from `mobile/`: `npm run check`.

Run from `backend/`: `./mvnw -B -ntp verify`.

Then run from `mobile/`:

```bash
npx expo export --platform android --output-dir /tmp/lumina-mobile-export-android-calendar
npx expo export --platform ios --output-dir /tmp/lumina-mobile-export-ios-calendar
```

Expected: all commands exit successfully; `git diff --check` is clean.

- [ ] **Step 7: Commit the mobile thumbnail**

```bash
git add mobile/src/types/api.ts mobile/src/components/workouts/workout-calendar.tsx mobile/src/app/\(app\)/\(tabs\)/workouts.tsx mobile/src/components/workouts/workout-calendar.test.tsx
git commit -m "feat(calendario): mostre miniaturas dos treinos"
```

## Rollback

Revert the calendar commits. Older mobile clients ignore the added `momentPath` field, and the existing `hasMoment`/icon behavior remains valid.
