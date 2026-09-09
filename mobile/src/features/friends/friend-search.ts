import type { FriendshipStatus } from "@/types/api";

export type AcaoDisponivelAmigo =
  | "ADICIONAR"
  | "CANCELAR"
  | "RESPONDER"
  | "REMOVER";

export function prepararBuscaAmigos(valor: string): string | null {
  const busca = valor.trim();
  return busca.length >= 2 ? busca : null;
}

export function acaoDisponivelAmigo(
  status: FriendshipStatus | null,
): AcaoDisponivelAmigo {
  if (status === "PENDING_SENT") return "CANCELAR";
  if (status === "PENDING_RECEIVED") return "RESPONDER";
  if (status === "ACCEPTED") return "REMOVER";
  return "ADICIONAR";
}
