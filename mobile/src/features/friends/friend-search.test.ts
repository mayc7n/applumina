import { describe, expect, test } from "@jest/globals";

import {
  acaoDisponivelAmigo,
  prepararBuscaAmigos,
} from "./friend-search";

describe("busca de amigos", () => {
  test("normaliza uma busca válida", () => {
    expect(prepararBuscaAmigos("  maria silva  ")).toBe("maria silva");
  });

  test("rejeita buscas menores que dois caracteres", () => {
    expect(prepararBuscaAmigos(" a ")).toBeNull();
    expect(prepararBuscaAmigos("   ")).toBeNull();
  });

  test("define a ação segura para cada vínculo", () => {
    expect(acaoDisponivelAmigo(null)).toBe("ADICIONAR");
    expect(acaoDisponivelAmigo("PENDING_SENT")).toBe("CANCELAR");
    expect(acaoDisponivelAmigo("PENDING_RECEIVED")).toBe("RESPONDER");
    expect(acaoDisponivelAmigo("ACCEPTED")).toBe("REMOVER");
  });
});
