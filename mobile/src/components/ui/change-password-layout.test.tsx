import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const fonteSenha = readFileSync(
  resolve(__dirname, "../../app/(app)/change-password.tsx"),
  "utf8",
);

describe("tradução da alteração de senha", () => {
  test("usa a chave localizada para confirmar o sucesso", () => {
    expect(fonteSenha).toContain('text: traduzir("comum.ok")');
    expect(fonteSenha).not.toContain('text: "OK"');
  });
});
