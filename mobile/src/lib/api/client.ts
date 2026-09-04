import { create, type InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";

import {
  limparSessao,
  notificarSessaoExpirada,
  obterTokenAcesso,
  obterTokenRenovacao,
  salvarParTokens,
} from "@/lib/auth/session";
import type { ApiEnvelope, TokenPair } from "@/types/api";

import { ErroConfiguracaoApi } from "./errors";
import { criarCabecalhosAparelho } from "./device";

const urlApiConfigurada = process.env.EXPO_PUBLIC_API_URL?.trim().replace(
  /\/$/,
  "",
);
const urlApiIndisponivel = "https://invalid.lumina.local/api";
const cabecalhosAparelho = criarCabecalhosAparelho(
  Platform.OS,
  Platform.Version,
);

const clienteApi = create({
  baseURL: urlApiConfigurada || urlApiIndisponivel,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...cabecalhosAparelho,
  },
});

const transporteAutenticacao = create({
  baseURL: urlApiConfigurada || urlApiIndisponivel,
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...cabecalhosAparelho,
  },
});

let promessaRenovacao: Promise<void> | null = null;

function garantirApiConfigurada(): void {
  if (!urlApiConfigurada) throw new ErroConfiguracaoApi();
  if (!__DEV__ && urlApiConfigurada.startsWith("http://")) {
    throw new ErroConfiguracaoApi(
      "A API deve usar HTTPS fora do build local de desenvolvimento.",
    );
  }
}

function extrairDados<T>(conteudo: ApiEnvelope<T>): T {
  if (!conteudo.success) {
    throw new Error(
      conteudo.error?.message ?? "Resposta inválida do servidor.",
    );
  }
  return conteudo.data as T;
}

function ehRequisicaoAutenticacaoMobile(url?: string): boolean {
  return Boolean(url?.includes("/auth/mobile/"));
}

clienteApi.interceptors.request.use((configuracao) => {
  garantirApiConfigurada();
  const token = obterTokenAcesso();
  if (token) configuracao.headers.Authorization = `Bearer ${token}`;
  return configuracao;
});

clienteApi.interceptors.response.use(
  (resposta) => resposta,
  async (erro) => {
    const requisicao = erro.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (
      !requisicao ||
      erro.response?.status !== 401 ||
      requisicao._retry ||
      ehRequisicaoAutenticacaoMobile(requisicao.url)
    ) {
      return Promise.reject(erro);
    }

    requisicao._retry = true;
    try {
      promessaRenovacao ??= renovarTokenAcesso().finally(() => {
        promessaRenovacao = null;
      });
      await promessaRenovacao;
      return clienteApi(requisicao);
    } catch (erroRenovacao) {
      await limparSessao();
      notificarSessaoExpirada();
      return Promise.reject(erroRenovacao);
    }
  },
);

export async function renovarTokenAcesso(): Promise<void> {
  garantirApiConfigurada();
  const refreshToken = await obterTokenRenovacao();
  if (!refreshToken) throw new Error("Sessão não encontrada.");

  const resposta = await transporteAutenticacao.post<ApiEnvelope<TokenPair>>(
    "/auth/mobile/refresh",
    {
      refreshToken,
    },
  );
  await salvarParTokens(extrairDados(resposta.data));
}

export async function obterApi<T>(
  url: string,
  parametros?: Record<string, unknown>,
): Promise<T> {
  const resposta = await clienteApi.get<ApiEnvelope<T>>(url, {
    params: parametros,
  });
  return extrairDados(resposta.data);
}

export async function enviarApi<T>(url: string, dados?: unknown): Promise<T> {
  const resposta = await clienteApi.post<ApiEnvelope<T>>(url, dados);
  return extrairDados(resposta.data);
}

export async function atualizarParcialApi<T>(
  url: string,
  dados?: unknown,
): Promise<T> {
  const resposta = await clienteApi.patch<ApiEnvelope<T>>(url, dados);
  return extrairDados(resposta.data);
}

export async function atualizarApi<T>(url: string, dados?: unknown): Promise<T> {
  const resposta = await clienteApi.put<ApiEnvelope<T>>(url, dados);
  return extrairDados(resposta.data);
}

export async function excluirApi(url: string, dados?: unknown): Promise<void> {
  await clienteApi.delete(url, { data: dados });
}

export async function enviarPublico<T>(
  url: string,
  dados?: unknown,
): Promise<T> {
  garantirApiConfigurada();
  const resposta = await transporteAutenticacao.post<ApiEnvelope<T>>(
    url,
    dados,
  );
  return extrairDados(resposta.data);
}
