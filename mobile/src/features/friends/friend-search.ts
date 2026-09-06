import type { FriendshipStatus } from "@/types/api";

export type AcaoDisponivelAmigo =
  | "ADICIONAR"
  | "AGUARDAR"
  | "RESPONDER"
  | "NENHUMA";

export function prepararBuscaAmigos(valor: string): string | null {
  const busca = valor.trim();
  return busca.length >= 2 ? busca : null;
}

export function acaoDisponivelAmigo(
  status: FriendshipStatus | null,
): AcaoDisponivelAmigo {
  if (status === "PENDING_SENT") return "AGUARDAR";
  if (status === "PENDING_RECEIVED") return "RESPONDER";
  if (status === "ACCEPTED") return "NENHUMA";
  return "ADICIONAR";
}
