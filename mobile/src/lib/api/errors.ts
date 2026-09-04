import { isAxiosError } from "axios";

import type { ApiEnvelope } from "@/types/api";

export class ErroConfiguracaoApi extends Error {
  constructor() {
    super("Configure EXPO_PUBLIC_API_URL antes de conectar o aplicativo.");
    this.name = "ErroConfiguracaoApi";
  }
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
