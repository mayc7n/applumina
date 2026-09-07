export const chaveTreinos = ["treinos"] as const;

export function chavesTreinosUsuario(userId?: string) {
  const base = [...chaveTreinos, userId ?? "sem-usuario"] as const;
  return {
    base,
    lista: [...base, "lista"] as const,
    detalhe: (id: string) => [...base, "detalhe", id] as const,
  };
}
