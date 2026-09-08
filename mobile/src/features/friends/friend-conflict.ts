import type { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import type { ApiEnvelope } from "@/types/api";

import { chavesAmigosUsuario } from "./friend-query-keys";

const CODIGO_CONFLITO_AMIZADE = "FRIENDSHIP_ALREADY_EXISTS";

export function ehConflitoSolicitacaoAmizade(erro: unknown): boolean {
  return (
    isAxiosError<ApiEnvelope<unknown>>(erro) &&
    erro.response?.status === 409 &&
    erro.response.data?.error?.code === CODIGO_CONFLITO_AMIZADE
  );
}

export async function reconciliarConflitoSolicitacaoAmizade(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  erro: unknown,
): Promise<boolean> {
  if (!userId || !ehConflitoSolicitacaoAmizade(erro)) return false;
  await clienteConsultas.invalidateQueries({
    queryKey: chavesAmigosUsuario(userId).base,
  });
  return true;
}
