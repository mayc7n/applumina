import { describe, expect, test } from "@jest/globals";

import { chaveConsultaSessoes, ordenarSessoes } from "./sessions";
import type { UserSession } from "@/types/api";

const base: Omit<UserSession, "id" | "current"> = {
  deviceType: "MOBILE_ANDROID",
  deviceName: "Android 36",
  lastUsedAt: "2026-09-04T16:00:00Z",
  createdAt: "2026-09-04T15:00:00Z",
};

describe("ordenarSessoes", () => {
  test("mantém a sessão atual em primeiro lugar", () => {
    const resultado = ordenarSessoes([
      { ...base, id: "outra", current: false },
      { ...base, id: "atual", current: true },
    ]);

    expect(resultado.map((sessao) => sessao.id)).toEqual(["atual", "outra"]);
  });

  test("não altera a resposta recebida da API", () => {
    const sessoes = [
      { ...base, id: "outra", current: false },
      { ...base, id: "atual", current: true },
    ];

    ordenarSessoes(sessoes);

    expect(sessoes[0].id).toBe("outra");
  });
});

describe("chaveConsultaSessoes", () => {
  test("isola o cache por usuário", () => {
    expect(chaveConsultaSessoes("usuario-a")).toEqual([
      "sessoes",
      "usuario-a",
    ]);
    expect(chaveConsultaSessoes("usuario-b")).toEqual([
      "sessoes",
      "usuario-b",
    ]);
  });
});
