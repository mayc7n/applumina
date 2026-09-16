import { describe, expect, jest, test } from "@jest/globals";
import React from "react";
import { act, create } from "react-test-renderer";

import type { User } from "@/types/api";

const mockUseLocales = jest.fn();

jest.mock("expo-localization", () => ({ useLocales: mockUseLocales }));

const { resolverIdioma, traduzirNoIdioma, useIdioma } =
  jest.requireActual<typeof import("./idioma")>("./idioma");
const {
  useArmazenamentoAutenticacao,
} = jest.requireActual<typeof import("@/store/auth-store")>(
  "@/store/auth-store",
);

function criarUsuario(locale: string): User {
  return {
    id: "usuario-1",
    email: "usuario@exemplo.com",
    username: "usuario",
    displayName: "Usuário",
    timezone: "America/Sao_Paulo",
    locale,
    status: "ACTIVE",
    role: "USER",
    plan: "FREE",
    emailVerified: true,
    twoFactorEnabled: false,
    onboardingComplete: true,
    createdAt: "2026-09-15T00:00:00.000Z",
  };
}

describe("resolverIdioma", () => {
  test("prioriza a preferência en do usuário sobre o idioma do aparelho", () => {
    expect(resolverIdioma("en", "pt-BR")).toBe("en");
  });

  test("usa o idioma do aparelho quando não há preferência válida", () => {
    expect(resolverIdioma(undefined, "en-US")).toBe("en");
    expect(resolverIdioma(undefined, "pt-BR")).toBe("pt-BR");
  });

  test("usa o fallback do aparelho para locale desconhecido", () => {
    expect(resolverIdioma("fr", "en-US")).toBe("en");
  });
});

describe("traduzirNoIdioma", () => {
  test("mostra o sucesso de idioma no idioma que acabou de ser selecionado", () => {
    expect(traduzirNoIdioma("en", "conta.idiomaSucesso")).toBe(
      "Language updated.",
    );
  });
});

describe("useIdioma", () => {
  test("prioriza o idioma salvo da conta sobre o idioma do aparelho", () => {
    mockUseLocales.mockReturnValue([{ languageTag: "pt-BR", languageCode: "pt" }]);
    useArmazenamentoAutenticacao.setState({ usuario: criarUsuario("en") });
    let idiomaAtual: string | undefined;

    function ConsumidorIdioma() {
      idiomaAtual = useIdioma().idioma;
      return null;
    }

    act(() => {
      create(React.createElement(ConsumidorIdioma));
    });

    expect(idiomaAtual).toBe("en");
  });
});
