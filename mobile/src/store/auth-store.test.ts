import { afterEach, describe, expect, test } from "@jest/globals";

import { clienteConsultas } from "@/providers/query-provider";

import { useArmazenamentoAutenticacao } from "./auth-store";

describe("cache privado da autenticação", () => {
  afterEach(() => {
    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "naoAutenticado",
      usuario: null,
    });
  });

  test("remove dados privados quando a sessão expira", () => {
    clienteConsultas.setQueryData(["amigos", "lista"], [
      { id: "private-friend" },
    ]);
    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario: null,
    });

    useArmazenamentoAutenticacao.getState().marcarNaoAutenticado();

    expect(clienteConsultas.getQueryData(["amigos", "lista"])).toBeUndefined();
  });
});
