import * as SecureStore from "expo-secure-store";

import type { TokenPair } from "@/types/api";

const CHAVE_TOKEN_RENOVACAO = "lumina.refresh-token.v1";

let tokenAcesso: string | null = null;
let aoExpirarSessao: (() => void) | undefined;

const opcoesArmazenamentoSeguro: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export function obterTokenAcesso(): string | null {
  return tokenAcesso;
}

export function registrarAoExpirarSessao(tratador: () => void): void {
  aoExpirarSessao = tratador;
}

export function notificarSessaoExpirada(): void {
  aoExpirarSessao?.();
}

export async function salvarParTokens(tokens: TokenPair): Promise<void> {
  tokenAcesso = tokens.accessToken;
  await SecureStore.setItemAsync(
    CHAVE_TOKEN_RENOVACAO,
    tokens.refreshToken,
    opcoesArmazenamentoSeguro,
  );
}

export async function obterTokenRenovacao(): Promise<string | null> {
  return SecureStore.getItemAsync(
    CHAVE_TOKEN_RENOVACAO,
    opcoesArmazenamentoSeguro,
  );
}

export async function limparSessao(): Promise<void> {
  tokenAcesso = null;
  await SecureStore.deleteItemAsync(
    CHAVE_TOKEN_RENOVACAO,
    opcoesArmazenamentoSeguro,
  );
}
