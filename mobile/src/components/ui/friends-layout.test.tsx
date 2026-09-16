import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const fonteAmigos = readFileSync(
  resolve(__dirname, "../../app/(app)/(tabs)/friends.tsx"),
  "utf8",
);

describe("estado visitante de amigos", () => {
  test("não aninha um cartão dentro de outro cartão", () => {
    const inicioVisitante = fonteAmigos.indexOf("const cabecalho = !autenticado ? (");
    const fimVisitante = fonteAmigos.indexOf(") : carregando ?", inicioVisitante);
    expect(inicioVisitante).toBeGreaterThanOrEqual(0);
    expect(fimVisitante).toBeGreaterThan(inicioVisitante);
    const trechoVisitante = fonteAmigos.slice(inicioVisitante, fimVisitante);

    expect(trechoVisitante).toContain("<FeedbackState");
    expect(trechoVisitante).not.toContain("styles.visitante");
    expect(trechoVisitante).not.toContain("styles.visitanteIcone");
  });
});
