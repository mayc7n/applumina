import { describe, expect, test } from "@jest/globals";

import { temaClaro, temaEscuro } from "./theme";

function luminancia(hexadecimal: string): number {
  const canais = hexadecimal
    .slice(1)
    .match(/.{2}/g)!
    .map((canal) => Number.parseInt(canal, 16) / 255)
    .map((canal) =>
      canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
}

function contraste(frente: string, fundo: string): number {
  const primeira = luminancia(frente);
  const segunda = luminancia(fundo);
  return (
    (Math.max(primeira, segunda) + 0.05) /
    (Math.min(primeira, segunda) + 0.05)
  );
}

describe.each([
  ["claro", temaClaro],
  ["escuro", temaEscuro],
])("contraste do tema %s", (_nome, tema) => {
  test.each([
    ["texto no fundo", tema.cores.texto, tema.cores.fundo],
    ["texto em superfície", tema.cores.texto, tema.cores.elevado],
    ["texto secundário", tema.cores.textoSecundario, tema.cores.fundo],
    ["botão principal", tema.cores.sobreMarca, tema.cores.marca],
    ["marca suave", tema.cores.marca, tema.cores.marcaSuave],
  ])("mantém ao menos 4.5:1 em %s", (_uso, frente, fundo) => {
    expect(contraste(frente, fundo)).toBeGreaterThanOrEqual(4.5);
  });
});
