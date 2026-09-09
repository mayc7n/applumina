import { describe, expect, test } from "@jest/globals";

import { criarMovimento } from "./motion";

describe("movimento acessível", () => {
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
    });
  });
});
