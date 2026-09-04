import type { UserSession } from "@/types/api";

export function chaveConsultaSessoes(userId?: string) {
  return ["sessoes", userId ?? "visitante"] as const;
}

export function ordenarSessoes(sessoes: UserSession[]): UserSession[] {
  return [...sessoes].sort((primeira, segunda) => {
    if (primeira.current !== segunda.current) return primeira.current ? -1 : 1;
    return segunda.lastUsedAt.localeCompare(primeira.lastUsedAt);
  });
}
