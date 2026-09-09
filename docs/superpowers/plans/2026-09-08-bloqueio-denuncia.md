# Bloqueio e denúncia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar bloqueio, desbloqueio e denúncia privados no backend e no app nativo.

**Architecture:** Duas tabelas append-only/owner-controlled separam bloqueio de moderação. `SocialService` coordena bloqueio, vínculo e descoberta; tela mobile própria evita sobrecarregar linhas de amizade.

**Tech Stack:** Java 21, Spring Boot, PostgreSQL/Flyway/RLS, Testcontainers, React Native/Expo, TypeScript, TanStack Query, Zod e Jest.

**Spec:** `docs/superpowers/specs/2026-09-08-bloqueio-denuncia-design.md`

## Global Constraints

- Privacidade padrão e erros não revelam quem bloqueou.
- UI completa em Português do Brasil e English.
- Cache social sempre inclui `userId`.
- Nenhuma dependência nova.
- Migration somente expansiva; não remover dados no rollback implícito.
- Preservar `mobile/app.json`, `package.json`, `package-lock.json` e `tsconfig.json` locais.

---

### Task 1: Persistência privada de bloqueios e denúncias

**Files:**
- Create: `backend/src/main/resources/db/migration/V11__add_user_blocks_and_reports.sql`
- Create: `backend/src/main/java/com/lumina/domain/social/entity/UserBlock.java`
- Create: `backend/src/main/java/com/lumina/domain/social/entity/UserReport.java`
- Create: `backend/src/main/java/com/lumina/domain/social/repository/UserBlockRepository.java`
- Create: `backend/src/main/java/com/lumina/domain/social/repository/UserReportRepository.java`
- Create: `backend/src/test/java/com/lumina/application/service/SocialSafetyPersistenceIntegrationTest.java`

**Interfaces:**
- Consumes: `lumina_current_user_id()` e UUID de `users`.
- Produces: `existsBetween(UUID, UUID)`, `findByBlockerId(UUID)`, `deleteOwned(UUID, UUID)` e entidades persistíveis.

- [ ] **Step 1: Write the failing integration test**

```java
@Test
void keepsBlocksOwnerControlledAndReportsHiddenFromTarget() {
    authenticated(aliceId, () -> userBlockRepository.saveAndFlush(block(aliceId, bobId)));
    authenticated(bobId, () -> assertThat(userBlockRepository.findByBlockerId(bobId)).isEmpty());
    authenticated(aliceId, () -> userReportRepository.saveAndFlush(report(aliceId, bobId)));
    authenticated(bobId, () -> assertThat(userReportRepository.findAll()).isEmpty());
}
```

- [ ] **Step 2: Run test to verify RED**

Run: `cd backend && ./mvnw -B -ntp -Dtest=SocialSafetyPersistenceIntegrationTest test`
Expected: test compilation fails because migration, entities and repositories do not exist.

- [ ] **Step 3: Add migration and mappings**

```sql
CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(40) NOT NULL,
  details VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reporter_id <> reported_user_id)
);
```

Add participant-readable, blocker-writable RLS to `user_blocks`; add reporter-only insert/select RLS to `user_reports`. Map immutable IDs and timestamps. Implement explicit JPQL queries with actor IDs.

- [ ] **Step 4: Run GREEN proof**

Run: `cd backend && ./mvnw -B -ntp -Dtest=SocialSafetyPersistenceIntegrationTest test`
Expected: all tests pass under restricted `NOSUPERUSER NOBYPASSRLS` role.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/resources/db/migration/V11__add_user_blocks_and_reports.sql backend/src/main/java/com/lumina/domain/social backend/src/test/java/com/lumina/application/service/SocialSafetyPersistenceIntegrationTest.java
git diff --cached --check
git commit -m "feat(privacidade): persista bloqueios e denúncias"
```

### Task 2: Regras e API social seguras

**Files:**
- Create: `backend/src/main/java/com/lumina/api/dto/CreateUserBlockRequest.java`
- Create: `backend/src/main/java/com/lumina/api/dto/CreateUserReportRequest.java`
- Modify: `backend/src/main/java/com/lumina/api/controller/SocialController.java`
- Modify: `backend/src/main/java/com/lumina/application/service/SocialService.java`
- Modify: `backend/src/main/java/com/lumina/domain/social/repository/FriendshipRepository.java`
- Modify: `backend/src/main/java/com/lumina/domain/user/repository/UserRepository.java`
- Modify: `backend/src/test/java/com/lumina/application/service/SocialServiceTest.java`
- Modify: `backend/src/test/java/com/lumina/api/controller/SocialControllerTest.java`

**Interfaces:**
- Consumes: repositories da Task 1.
- Produces: `block`, `unblock`, `blockedUsers`, `report`; endpoints `/social/blocks` e `/social/reports`.

- [ ] **Step 1: Write failing service tests**

```java
@Test
void blockingRemovesRelationshipAndPreventsFutureRequest() {
    socialService.block(userId, otherUser.getId());
    verify(friendshipRepository).deleteBetween(userId, otherUser.getId());
    when(userBlockRepository.existsBetween(userId, otherUser.getId())).thenReturn(true);
    assertThatThrownBy(() -> socialService.request(userId, otherUser.getId()))
        .isInstanceOf(ResourceNotFoundException.class);
}

@Test
void reportRejectsSelfAndNormalizesDetails() {
    assertThatThrownBy(() -> socialService.report(userId,
        new CreateUserReportRequest(userId, "SPAM", " detalhe ")))
        .isInstanceOf(ConflictException.class);
}
```

- [ ] **Step 2: Run service tests to verify RED**

Run: `cd backend && ./mvnw -B -ntp -Dtest=SocialServiceTest test`
Expected: compilation fails for missing methods and DTOs.

- [ ] **Step 3: Implement minimal service and API**

```java
@Transactional
public void block(UUID userId, UUID targetId) {
    validateOtherActiveUser(userId, targetId);
    friendshipRepository.lockPair(userId, targetId);
    userBlockRepository.createIfAbsent(userId, targetId);
    friendshipRepository.deleteBetween(userId, targetId);
}
```

Use a canonical PostgreSQL advisory transaction lock in both `block` and `request`. Filter search/list/request/accept with `existsBetween`. Return `204` for block/unblock and `201` without report details for report. Validate category enum and details length 1.000.

- [ ] **Step 4: Verify backend behavior**

Run: `cd backend && ./mvnw -B -ntp verify`
Expected: all unit, migration, RLS and concurrency tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java backend/src/test/java
git diff --cached --check
git commit -m "feat(privacidade): aplique bloqueio social"
```

### Task 3: Fluxo mobile de segurança

**Files:**
- Create: `mobile/src/app/(app)/friends/safety/[id].tsx`
- Create: `mobile/src/app/(app)/friends/blocked.tsx`
- Create: `mobile/src/features/friends/safety-schema.ts`
- Create: `mobile/src/features/friends/safety-schema.test.ts`
- Modify: `mobile/src/lib/api/resources.ts`
- Modify: `mobile/src/features/friends/hooks.ts`
- Modify: `mobile/src/features/friends/friend-query-keys.ts`
- Modify: `mobile/src/types/api.ts`
- Modify: `mobile/src/components/friends/friend-row.tsx`
- Modify: `mobile/src/components/friends/friends-search.tsx`
- Modify: `mobile/src/app/(app)/(tabs)/friends.tsx`
- Modify: `mobile/src/i18n/idioma.ts`

**Interfaces:**
- Consumes: endpoints da Task 2.
- Produces: tela de segurança por usuário, lista de bloqueados e formulário validado.

- [ ] **Step 1: Write failing schema and action tests**

```typescript
test("exige categoria e limita detalhes a 1000 caracteres", () => {
  expect(criarEsquemaDenuncia(traduzir).safeParse({ category: "", details: "" }).success).toBe(false);
  expect(criarEsquemaDenuncia(traduzir).safeParse({ category: "SPAM", details: "x".repeat(1001) }).success).toBe(false);
});
```

- [ ] **Step 2: Run mobile test to verify RED**

Run: `cd mobile && npm test -- --runInBand src/features/friends/safety-schema.test.ts`
Expected: test fails because `criarEsquemaDenuncia` does not exist.

- [ ] **Step 3: Implement screens, hooks and translations**

```typescript
export const criarEsquemaDenuncia = (traduzir: Traduzir) => z.object({
  category: z.enum(["HARASSMENT", "SPAM", "HATE", "IMPERSONATION", "INAPPROPRIATE_CONTENT", "OTHER"]),
  details: z.string().trim().max(1000, traduzir("amigos.denunciaDetalhesMaximo")),
});
```

Navigate from a single “Segurança” action. Confirm block, submit report without echoing details, list blocked users with unblock action, and invalidate only `chavesAmigosUsuario(userId).base`.

- [ ] **Step 4: Verify mobile behavior and bundles**

Run: `cd mobile && npm run check`
Expected: typecheck, lint and all Jest suites pass.

Run: `cd mobile && npx expo export --platform android --output-dir /tmp/lumina-safety-android`
Expected: Android export succeeds.

Run: `cd mobile && npx expo export --platform ios --output-dir /tmp/lumina-safety-ios`
Expected: iOS export succeeds.

- [ ] **Step 5: Commit**

```bash
git add mobile/src
git diff --cached --check
git commit -m "feat(privacidade): exponha segurança social"
```

### Task 4: Revisão e publicação

**Files:**
- Review: every file changed by Tasks 1-3.

**Interfaces:**
- Consumes: complete backend/mobile slice.
- Produces: reviewed commits confirmed on `origin/main`.

- [ ] **Step 1: Request independent review**

Review authorization, RLS, race handling, cache isolation, i18n, accessibility and sensitive report data. Fix every critical or important finding with a failing regression test first.

- [ ] **Step 2: Run final gates**

Run: `cd backend && ./mvnw -B -ntp verify`
Run: `cd mobile && npm run check`
Run both Expo exports from Task 3 again after review fixes.

- [ ] **Step 3: Publish and confirm**

```bash
git push origin main
git ls-remote --heads origin main
git status --short --branch
```

Expected: remote SHA equals local `HEAD`; only pre-existing root/mobile config changes remain unstaged.
