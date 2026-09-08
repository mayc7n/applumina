import { describe, expect, test } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  ehConflitoSolicitacaoAmizade,
  reconciliarConflitoSolicitacaoAmizade,
} from "./friend-conflict";

function erroApi(status: number, code: string) {
  return new AxiosError("API error", "ERR_BAD_RESPONSE", undefined, undefined, {
    status,
    statusText: "Error",
    headers: {},
    config: { headers: {} } as never,
    data: { success: false, error: { code, message: "error" } },
  });
}

describe("conflito de solicitação de amizade", () => {
  test("reconhece somente o conflito específico retornado pela API", () => {
    expect(
      ehConflitoSolicitacaoAmizade(
        erroApi(409, "FRIENDSHIP_ALREADY_EXISTS"),
      ),
    ).toBe(true);
    expect(ehConflitoSolicitacaoAmizade(erroApi(409, "OTHER_CONFLICT"))).toBe(
      false,
    );
    expect(
      ehConflitoSolicitacaoAmizade(
        erroApi(500, "FRIENDSHIP_ALREADY_EXISTS"),
      ),
    ).toBe(false);
  });

  test("invalida somente o cache social do usuário após conflito", async () => {
    const clienteConsultas = new QueryClient();
    const buscaUsuarioA = ["amigos", "usuario-a", "busca", "bo"];
    const buscaUsuarioB = ["amigos", "usuario-b", "busca", "bo"];
    clienteConsultas.setQueryData(buscaUsuarioA, []);
    clienteConsultas.setQueryData(buscaUsuarioB, []);

    const reconciliado = await reconciliarConflitoSolicitacaoAmizade(
      clienteConsultas,
      "usuario-a",
      erroApi(409, "FRIENDSHIP_ALREADY_EXISTS"),
    );

    expect(reconciliado).toBe(true);
    expect(clienteConsultas.getQueryState(buscaUsuarioA)?.isInvalidated).toBe(
      true,
    );
    expect(clienteConsultas.getQueryState(buscaUsuarioB)?.isInvalidated).toBe(
      false,
    );
    clienteConsultas.clear();
  });
});
