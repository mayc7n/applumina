import { describe, expect, test } from "@jest/globals";

import { chavesAmigosUsuario } from "./friend-query-keys";

describe("cache privado de amigos", () => {
  test("isola listas e buscas pela identidade autenticada", () => {
    const primeiraConta = chavesAmigosUsuario("user-a");
    const segundaConta = chavesAmigosUsuario("user-b");

    expect(primeiraConta.lista).not.toEqual(segundaConta.lista);
    expect(primeiraConta.solicitacoes).not.toEqual(segundaConta.solicitacoes);
    expect(primeiraConta.bloqueados).not.toEqual(segundaConta.bloqueados);
    expect(primeiraConta.busca("maria")).not.toEqual(
      segundaConta.busca("maria"),
    );
  });
});
