import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";

import { renovarTokenAcesso } from "@/lib/api/client";
import { apiAutenticacaoMobile, apiUsuarios } from "@/lib/api/resources";
import * as sessao from "@/lib/auth/session";
import { clienteConsultas } from "@/providers/query-provider";
import type { User } from "@/types/api";

import { useArmazenamentoAutenticacao } from "./auth-store";

jest.mock("@/lib/api/client", () => ({ renovarTokenAcesso: jest.fn<() => Promise<void>>() }));

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

describe("coordenação de perfil e sessão", () => {
  const auth = useArmazenamentoAutenticacao;

  beforeEach(() => {
    auth.setState(auth.getInitialState());
    jest.spyOn(sessao, "obterTokenRenovacao").mockResolvedValue("refresh");
    jest.spyOn(sessao, "limparSessao").mockResolvedValue();
    jest.spyOn(sessao, "salvarParTokens").mockResolvedValue();
    jest.spyOn(apiUsuarios, "atual").mockResolvedValue(usuario);
    jest.spyOn(apiUsuarios, "excluir").mockResolvedValue();
    jest.spyOn(apiAutenticacaoMobile, "sair").mockResolvedValue();
    jest.spyOn(apiAutenticacaoMobile, "entrar").mockResolvedValue({ accessToken: "access", refreshToken: "refresh", expiresIn: 900 });
    jest.spyOn(apiAutenticacaoMobile, "cadastrar").mockResolvedValue({ accessToken: "access", refreshToken: "refresh", expiresIn: 900 });
    jest.mocked(renovarTokenAcesso).mockReset().mockResolvedValue();
  });

  afterEach(() => {
    auth.setState(auth.getInitialState());
    clienteConsultas.clear();
    jest.restoreAllMocks();
  });

  test("restaura o User e seu locale e permite recarga posterior autoritativa", async () => {
    await auth.getState().inicializar();
    expect(auth.getState()).toMatchObject({ estado: "autenticado", usuario, geracaoSessao: 1 });
    auth.getState().atualizarIdioma("en");
    auth.getState().finalizarAtualizacaoIdioma();
    // Uma leitura iniciada depois do PATCH concluído pode aceitar a preferência do backend.
    jest.mocked(apiUsuarios.atual).mockResolvedValue({ ...usuario, bio: "Nova bio" });
    await auth.getState().inicializar();
    expect(auth.getState()).toMatchObject({ usuario: { locale: "pt-BR", bio: "Nova bio" }, geracaoSessao: 1, idiomaSalvando: false });
  });

  test("continua desautenticando e limpando dados quando não há token", async () => {
    jest.mocked(sessao.obterTokenRenovacao).mockResolvedValue(null);
    clienteConsultas.setQueryData(["privado"], usuario);
    await auth.getState().inicializar();
    expect(auth.getState()).toMatchObject({ estado: "naoAutenticado", usuario: null, geracaoSessao: 1, idiomaSalvando: false });
    expect(clienteConsultas.getQueryData(["privado"])).toBeUndefined();
    expect(apiUsuarios.atual).not.toHaveBeenCalled();
  });

  test("mantém limpeza da sessão quando a restauração atual falha", async () => {
    jest.mocked(renovarTokenAcesso).mockRejectedValue(new Error("token expirado"));
    await auth.getState().inicializar();
    expect(sessao.limparSessao).toHaveBeenCalledTimes(1);
    expect(auth.getState()).toMatchObject({ estado: "naoAutenticado", usuario: null, geracaoSessao: 1 });
  });

  test.each(["sucesso", "falha"])("ignora %s da recarga antiga ao receber duas respostas fora de ordem", async (resultado) => {
    await auth.getState().inicializar();
    const antigo = promessaControlada<User>();
    const recente = promessaControlada<User>();
    jest.mocked(apiUsuarios.atual).mockReturnValueOnce(antigo.promessa).mockReturnValueOnce(recente.promessa);
    const primeira = auth.getState().inicializar();
    await Promise.resolve();
    await Promise.resolve();
    const segunda = auth.getState().inicializar();
    await Promise.resolve();
    await Promise.resolve();
    recente.resolver({ ...usuario, locale: "en", bio: "Perfil recente" });
    await segunda;
    if (resultado === "sucesso") antigo.resolver(usuario);
    else antigo.rejeitar(new Error("resposta antiga"));
    await primeira;
    expect(auth.getState()).toMatchObject({ usuario: { locale: "en", bio: "Perfil recente" }, geracaoSessao: 1 });
    expect(sessao.limparSessao).not.toHaveBeenCalled();
  });

  test.each(["sucesso", "falha"])("ignora %s do perfil da sessão anterior após novo login", async (resultado) => {
    await auth.getState().inicializar();
    const perfilAntigo = promessaControlada<User>();
    jest.mocked(apiUsuarios.atual).mockReturnValueOnce(perfilAntigo.promessa);
    const recarga = auth.getState().inicializar();
    await Promise.resolve();
    await Promise.resolve();
    auth.getState().marcarNaoAutenticado();
    jest.mocked(apiUsuarios.atual).mockResolvedValue({ ...usuario, locale: "en" });
    await auth.getState().entrar({ email: usuario.email, password: "senha" });
    if (resultado === "sucesso") perfilAntigo.resolver(usuario);
    else perfilAntigo.rejeitar(new Error("perfil antigo"));
    await recarga;
    expect(auth.getState()).toMatchObject({ estado: "autenticado", usuario: { locale: "en" }, geracaoSessao: 3 });
    expect(sessao.limparSessao).not.toHaveBeenCalled();
  });

  test("ignora token ausente de inicialização antiga após autenticar", async () => {
    const token = promessaControlada<string | null>();
    jest.mocked(sessao.obterTokenRenovacao).mockReturnValueOnce(token.promessa);
    const inicializacao = auth.getState().inicializar();
    await auth.getState().entrar({ email: usuario.email, password: "senha" });
    token.resolver(null);
    await inicializacao;
    expect(auth.getState()).toMatchObject({ estado: "autenticado", usuario, geracaoSessao: 1 });
  });

  test("interrompe a leitura de perfil se a sessão mudar enquanto renova o token", async () => {
    const renovacao = promessaControlada<void>();
    jest.mocked(renovarTokenAcesso).mockReturnValueOnce(renovacao.promessa);
    const inicializacao = auth.getState().inicializar();
    await Promise.resolve();
    auth.getState().marcarNaoAutenticado();
    renovacao.resolver();
    await inicializacao;
    expect(apiUsuarios.atual).not.toHaveBeenCalled();
    expect(auth.getState().estado).toBe("naoAutenticado");
  });

  test("mantém cadastro, exclusão e limpeza de uma preferência pendente", async () => {
    await auth.getState().cadastrar({ email: usuario.email, username: usuario.username, displayName: usuario.displayName, password: "senha" });
    expect(sessao.salvarParTokens).toHaveBeenCalled();
    expect(auth.getState()).toMatchObject({ estado: "autenticado", usuario, geracaoSessao: 1 });
    auth.getState().atualizarIdioma("en");
    await auth.getState().excluirConta({ password: "senha", confirmation: "EXCLUIR" });
    expect(auth.getState()).toMatchObject({ estado: "naoAutenticado", usuario: null, geracaoSessao: 2, idiomaSalvando: false });
  });
});
