import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const fonteConta = readFileSync(
  resolve(__dirname, "../../app/(app)/account.tsx"),
  "utf8",
);

describe("ordem da conta", () => {
  test("apresenta preferências, privacidade, aparelhos e saída nessa ordem", () => {
    const indices = [
      fonteConta.search(
        /styles\.tituloSecao[\s\S]{0,400}\{traduzir\("conta\.preferenciasTitulo"\)\}/,
      ),
      fonteConta.search(
        /styles\.tituloSecao[\s\S]{0,400}\{traduzir\("conta\.privacidadeTitulo"\)\}/,
      ),
      fonteConta.search(
        /styles\.tituloSecao[\s\S]{0,400}\{traduzir\("conta\.aparelhosTitulo"\)\}/,
      ),
      fonteConta.search(
        /styles\.sairTitulo[\s\S]{0,120}\{traduzir\("conta\.sair"\)\}/,
      ),
    ];

    expect(indices.every((indice) => indice >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(fonteConta).toContain('onPress={() => router.back()}');
    expect(fonteConta).toContain('edges={["top", "left", "right", "bottom"]}');
  });
});
