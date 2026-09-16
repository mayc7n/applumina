import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import React, { type ReactNode } from "react";
import { Alert, Pressable } from "react-native";
import { act, create } from "react-test-renderer";

import { LanguageSelector } from "./language-selector";
import { renovarTokenAcesso } from "@/lib/api/client";
import { apiAutenticacaoMobile, apiUsuarios } from "@/lib/api/resources";
import * as sessao from "@/lib/auth/session";
import { useArmazenamentoAutenticacao as auth } from "@/store/auth-store";
import type { User } from "@/types/api";
import TelaConta from "@/app/(app)/account";

jest.mock("expo-localization", () => ({ useLocales: () => [{ languageTag: "pt-BR" }] }));
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("expo-image", () => ({ Image: () => null }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-image-manipulator", () => ({}));
jest.mock("lucide-react-native", () => Object.fromEntries([
  "ArrowLeft", "CircleAlert", "CircleCheck", "ChevronRight", "KeyRound", "Languages",
  "LogOut", "Monitor", "ShieldCheck", "Smartphone", "Trash2", "UserRound", "X",
].map((nome) => [nome, () => null])));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual<object>("@tanstack/react-query"),
  useQueryClient: () => ({ clear: jest.fn() }),
  useQuery: () => ({ data: [] }),
  useMutation: () => ({ isPending: false }),
}));
jest.mock("@/components/ui/animated-entry", () => ({
  AnimatedEntry: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/ui/app-button", () => ({ AppButton: () => null }));
jest.mock("@/components/ui/screen-header", () => ({ ScreenHeader: () => null }));
jest.mock("@/components/ui/feedback-state", () => ({ FeedbackState: () => null }));
jest.mock("@/features/workouts/hooks", () => ({ useListaTreinos: () => ({ data: [] }) }));
jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({ cores: new Proxy({}, { get: () => "#123456" }) }),
}));
jest.mock("@/lib/api/client", () => ({ renovarTokenAcesso: jest.fn<() => Promise<void>>() }));

function promessaControlada<T>() {
  let resolver!: (valor: T) => void;
  let rejeitar!: (erro: Error) => void;
  const promessa = new Promise<T>((resolve, reject) => { resolver = resolve; rejeitar = reject; });
  return { promessa, resolver, rejeitar };
}

const usuario: User = {
  id: "conta-a", email: "conta@example.com", username: "conta", displayName: "Conta",
  timezone: "America/Sao_Paulo", locale: "pt-BR", status: "ACTIVE", role: "USER",
  plan: "FREE", emailVerified: true, twoFactorEnabled: false, onboardingComplete: true,
  createdAt: "2026-09-15T00:00:00Z",
};

describe("idioma na Conta com store e seletor reais", () => {
  let arvore: ReturnType<typeof create>;
  let patch: ReturnType<typeof promessaControlada<User>>;

  beforeEach(() => {
    auth.setState({ ...auth.getInitialState(), estado: "autenticado", usuario, geracaoSessao: 1 });
    patch = promessaControlada<User>();
    jest.spyOn(apiUsuarios, "atualizarPerfil").mockReturnValue(patch.promessa);
    jest.spyOn(apiUsuarios, "atual").mockResolvedValue(usuario);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    jest.spyOn(sessao, "obterTokenRenovacao").mockResolvedValue("refresh");
    jest.spyOn(sessao, "limparSessao").mockResolvedValue();
    jest.spyOn(sessao, "salvarParTokens").mockResolvedValue();
    jest.spyOn(apiAutenticacaoMobile, "sair").mockResolvedValue();
    jest.spyOn(apiAutenticacaoMobile, "entrar").mockResolvedValue({ accessToken: "access", refreshToken: "refresh", expiresIn: 900 });
    jest.mocked(renovarTokenAcesso).mockResolvedValue();
    act(() => { arvore = create(<TelaConta />); });
  });

  afterEach(() => {
    act(() => arvore.unmount());
    auth.setState(auth.getInitialState());
    jest.restoreAllMocks();
  });

  function escolher(idioma: "pt-BR" | "en") {
    act(() => arvore.root.findByType(LanguageSelector).props.onChange(idioma));
  }

  function esperarIdioma(locale: string, salvando: boolean) {
    expect(auth.getState().usuario?.locale).toBe(locale);
    expect(arvore.root.findByType(LanguageSelector).props).toMatchObject({ idioma: locale, salvando });
  }

  test("aplica imediatamente, mantém somente o locale no sucesso e confirma em inglês", async () => {
    escolher("en");
    esperarIdioma("en", true);
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(apiUsuarios.atualizarPerfil).toHaveBeenCalledWith({ locale: "en" });
    await act(async () => patch.resolver({ ...usuario, locale: "en", bio: "perfil de outra leitura" }));
    esperarIdioma("en", false);
    expect(auth.getState().usuario?.bio).toBeUndefined();
    expect(Alert.alert).toHaveBeenCalledWith("Language updated.");
  });

  test("faz rollback e alerta no idioma anterior quando o PATCH falha", async () => {
    escolher("en");
    await act(async () => patch.rejeitar(new Error("offline")));
    esperarIdioma("pt-BR", false);
    expect(Alert.alert).toHaveBeenCalledWith("Não foi possível atualizar o idioma. Tente novamente.");
  });

  test("ignora a opção atual, cliques no mesmo frame e novas mudanças durante o salvamento", async () => {
    escolher("pt-BR");
    expect(apiUsuarios.atualizarPerfil).not.toHaveBeenCalled();
    const aoMudar = arvore.root.findByType(LanguageSelector).props.onChange;
    act(() => { aoMudar("en"); aoMudar("en"); });
    escolher("pt-BR");
    esperarIdioma("en", true);
    expect(apiUsuarios.atualizarPerfil).toHaveBeenCalledTimes(1);
    for (const opcao of arvore.root.findAllByType(Pressable).filter((item) => item.props.accessibilityRole === "radio")) {
      expect(opcao.props.disabled).toBe(true);
    }
    await act(async () => patch.resolver({ ...usuario, locale: "en" }));
    esperarIdioma("en", false);
  });

  test.each([
    ["antes", "antes", "sucesso"], ["antes", "depois", "sucesso"],
    ["durante", "antes", "sucesso"], ["durante", "depois", "sucesso"],
    ["antes", "antes", "falha"], ["antes", "depois", "falha"],
    ["durante", "antes", "falha"], ["durante", "depois", "falha"],
  ])("recarga iniciada %s do PATCH e concluída %s da resposta de %s", async (inicio, fim, resultado) => {
    const perfil = promessaControlada<User>();
    jest.mocked(apiUsuarios.atual).mockReturnValue(perfil.promessa);
    let recarga!: Promise<void>;
    if (inicio === "durante") escolher("en");
    await act(async () => { recarga = auth.getState().inicializar(); });
    expect(apiUsuarios.atual).toHaveBeenCalledTimes(1);
    if (inicio === "antes") escolher("en");
    const concluirRecarga = async () => {
      await act(async () => { perfil.resolver({ ...usuario, bio: "Bio atualizada" }); await recarga; });
      expect(auth.getState().usuario?.bio).toBe("Bio atualizada");
      expect(auth.getState().geracaoSessao).toBe(1);
    };
    if (fim === "antes") {
      await concluirRecarga();
      esperarIdioma("en", true);
    }
    await act(async () => {
      if (resultado === "sucesso") patch.resolver({ ...usuario, locale: "en" });
      else patch.rejeitar(new Error("offline"));
    });
    if (fim === "depois") await concluirRecarga();
    esperarIdioma(resultado === "sucesso" ? "en" : "pt-BR", false);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  test.each(["conta-a", "conta-b"])("ignora falha antiga após logout/login de %s sem desbloquear o novo PATCH", async (id) => {
    escolher("en");
    await act(async () => { await auth.getState().sair(); });
    jest.mocked(apiUsuarios.atual).mockResolvedValue({ ...usuario, id, locale: "en" });
    await act(async () => { await auth.getState().entrar({ email: usuario.email, password: "senha" }); });
    esperarIdioma("en", false);
    const patchNovo = promessaControlada<User>();
    jest.mocked(apiUsuarios.atualizarPerfil).mockReturnValue(patchNovo.promessa);
    escolher("pt-BR");
    await act(async () => patch.rejeitar(new Error("resposta da sessão antiga")));
    esperarIdioma("pt-BR", true);
    expect(auth.getState().usuario?.id).toBe(id);
    expect(Alert.alert).not.toHaveBeenCalled();
    await act(async () => patchNovo.resolver({ ...usuario, id }));
    esperarIdioma("pt-BR", false);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  test.each(["sucesso", "falha"])("ignora %s de PATCH após expiração da sessão", async (resultado) => {
    escolher("en");
    act(() => auth.getState().marcarNaoAutenticado());
    await act(async () => {
      if (resultado === "sucesso") patch.resolver({ ...usuario, locale: "en" });
      else patch.rejeitar(new Error("sessão encerrada"));
    });
    expect(auth.getState().usuario).toBeNull();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(arvore.root.findAllByType(LanguageSelector)).toHaveLength(0);
  });

  test.each([
    ["conta-a", "sucesso"], ["conta-b", "sucesso"],
    ["conta-a", "falha"], ["conta-b", "falha"],
  ])("ignora resposta antiga para %s (%s), preservando o locale do novo login", async (id, resultado) => {
    escolher("en");
    await act(async () => { await auth.getState().sair(); });
    jest.mocked(apiUsuarios.atual).mockResolvedValue({ ...usuario, id, locale: "en" });
    await act(async () => { await auth.getState().entrar({ email: usuario.email, password: "senha" }); });
    await act(async () => {
      if (resultado === "sucesso") patch.resolver({ ...usuario, locale: "en" });
      else patch.rejeitar(new Error("sessão antiga"));
    });
    esperarIdioma("en", false);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  test("mantém o bloqueio durante a remontagem da Conta", async () => {
    escolher("en");
    act(() => arvore.unmount());
    act(() => { arvore = create(<TelaConta />); });
    esperarIdioma("en", true);
    escolher("pt-BR");
    expect(apiUsuarios.atualizarPerfil).toHaveBeenCalledTimes(1);
    await act(async () => patch.resolver({ ...usuario, locale: "en" }));
    esperarIdioma("en", false);
  });

  test("ignora PATCH resolvido enquanto o logout ainda aguarda a rede", async () => {
    escolher("en");
    const logout = promessaControlada<void>();
    jest.mocked(apiAutenticacaoMobile.sair).mockReturnValue(logout.promessa);

    let saida!: Promise<void>;
    act(() => {
      saida = auth.getState().sair();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(apiAutenticacaoMobile.sair).toHaveBeenCalled();

    await act(async () => patch.resolver({ ...usuario, locale: "en" }));
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(auth.getState().usuario?.locale).toBe("en");

    await act(async () => {
      logout.resolver();
      await saida;
    });
    expect(auth.getState().usuario).toBeNull();

    jest.mocked(apiUsuarios.atual).mockResolvedValue({ ...usuario, locale: "pt-BR" });
    await act(async () => {
      await auth.getState().entrar({ email: usuario.email, password: "senha" });
    });
    expect(auth.getState().usuario).toMatchObject({ id: usuario.id, locale: "pt-BR" });
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
