import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const fonteConta = readFileSync(resolve(__dirname, "account.tsx"), "utf8");

describe("ordem da conta", () => {
  test("apresenta preferências, privacidade, aparelhos e saída nessa ordem", () => {
    const indices = [
      fonteConta.indexOf('{traduzir("conta.preferenciasTitulo")}'),
      fonteConta.indexOf('{traduzir("conta.privacidadeTitulo")}'),
      fonteConta.indexOf('{traduzir("conta.aparelhosTitulo")}'),
      fonteConta.indexOf('{traduzir("conta.sair")}'),
    ];

    expect(indices.every((indice) => indice >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });
});
