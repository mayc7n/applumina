import { describe, expect, test } from "@jest/globals";

import { criarMovimento } from "./motion";

describe("movimento acessível", () => {
  test("define transição curta para indicadores selecionados", () => {
    expect(
      (criarMovimento(false) as ReturnType<typeof criarMovimento> & {
        selecao?: unknown;
      }).selecao,
    ).toEqual({ duracao: 180, escalaInativa: 0.86 });
  });

  test("remove duração, deslocamento e escala quando a redução está ativa", () => {
    expect(criarMovimento(true)).toEqual({
      entrada: {
        deslocamentoY: 0,
        duracao: 0,
      },
      pressao: {
        duracao: 0,
        escala: 1,
      },
      selecao: {
        duracao: 0,
        escalaInativa: 1,
      },
    });
  });
});
