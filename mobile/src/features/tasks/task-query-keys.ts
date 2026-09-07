export const chaveTarefas = ["tarefas"] as const;
export const chavePainel = ["painel"] as const;
export const chaveProjetosTarefa = ["projetos-tarefa"] as const;
export const chaveEtiquetasTarefa = ["etiquetas-tarefa"] as const;

export function chavesTarefasUsuario(userId?: string) {
  const identidade = userId ?? "sem-usuario";
  const base = [...chaveTarefas, identidade] as const;
  return {
    base,
    lista: [...base, "lista"] as const,
    detalhe: (id: string) => [...base, "detalhe", id] as const,
    painel: [...chavePainel, identidade] as const,
    projetos: [...chaveProjetosTarefa, identidade] as const,
    etiquetas: [...chaveEtiquetasTarefa, identidade] as const,
  };
}
