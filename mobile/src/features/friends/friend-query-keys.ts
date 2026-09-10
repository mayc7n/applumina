export const chaveAmigos = ["amigos"] as const;

export function chavesAmigosUsuario(userId?: string) {
  const base = [...chaveAmigos, userId ?? "sem-usuario"] as const;
  return {
    base,
    lista: [...base, "lista"] as const,
    solicitacoes: [...base, "solicitacoes"] as const,
    bloqueados: [...base, "bloqueados"] as const,
    busca: (query: string) => [...base, "busca", query] as const,
  };
}
