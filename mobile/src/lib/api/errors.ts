import { isAxiosError } from "axios";

import type { ApiEnvelope } from "@/types/api";

export class ErroConfiguracaoApi extends Error {
  constructor(mensagem = "Configure EXPO_PUBLIC_API_URL antes de conectar o aplicativo.") {
    super(mensagem);
    this.name = "ErroConfiguracaoApi";
  }
}

export type MotivoFalhaApi =
  | "credenciais"
  | "semConexao"
  | "timeout"
  | "indisponivel"
  | "configuracao"
  | "desconhecido";

export function classificarFalhaApi(erro: unknown): MotivoFalhaApi {
  if (erro instanceof ErroConfiguracaoApi) return "configuracao";
  if (!isAxiosError<ApiEnvelope<unknown>>(erro)) return "desconhecido";

  if (
    erro.code === "ECONNABORTED" ||
    erro.code === "ETIMEDOUT" ||
    erro.message.toLowerCase().includes("timeout")
  ) {
    return "timeout";
  }
  if (!erro.response) return "semConexao";
  if (
    erro.response.status === 401 ||
    erro.response.data?.error?.code === "INVALID_CREDENTIALS"
  ) {
    return "credenciais";
  }
  if ([502, 503, 504].includes(erro.response.status)) return "indisponivel";
  return "desconhecido";
}

export function obterMensagemErroApi(
  erro: unknown,
  mensagemPadrao = "Não foi possível concluir a ação. Tente novamente.",
  usarMensagemServidor = true,
): string {
  if (!usarMensagemServidor) return mensagemPadrao;
  if (erro instanceof ErroConfiguracaoApi) return erro.message;
  if (isAxiosError<ApiEnvelope<unknown>>(erro)) {
    return erro.response?.data?.error?.message ?? mensagemPadrao;
  }
  return erro instanceof Error && erro.message ? erro.message : mensagemPadrao;
}
