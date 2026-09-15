import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

import { criarEsquemaDenuncia } from "./safety-schema";

const fonteDenuncia = readFileSync(
  resolve(__dirname, "../../app/(app)/friends/safety/[id].tsx"),
  "utf8",
);

const traduzir = ((chave: string) => chave) as Parameters<
  typeof criarEsquemaDenuncia
>[0];

describe("formulário de denúncia", () => {
  test("exige uma categoria permitida", () => {
    const resultado = criarEsquemaDenuncia(traduzir).safeParse({
      category: "",
      details: "",
    });

    expect(resultado.success).toBe(false);
  });

  test("limita detalhes a 1.000 caracteres após normalização", () => {
    const esquema = criarEsquemaDenuncia(traduzir);

    expect(
      esquema.safeParse({ category: "SPAM", details: "x".repeat(1001) })
        .success,
    ).toBe(false);
    expect(
      esquema.parse({ category: "SPAM", details: "  contexto  " }),
    ).toEqual({ category: "SPAM", details: "contexto" });
  });

  test("mantém o limite visual alinhado ao schema", () => {
    expect(fonteDenuncia).toContain("maxLength={1000}");
  });
});
