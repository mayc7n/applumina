import type { Task } from "@/types/api";

export type FiltroTarefa =
  | "TODAY"
  | "UPCOMING"
  | "OVERDUE"
  | "DONE"
  | "ALL";

function normalizar(texto?: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function filtrarTarefas(
  tarefas: Task[],
  filtro: FiltroTarefa,
  busca: string,
  hoje: string,
): Task[] {
  const termo = normalizar(busca.trim());
  return tarefas.filter((tarefa) => {
    const conteudo = normalizar(`${tarefa.title} ${tarefa.description ?? ""}`);
    if (
      termo &&
      !termo.split(/\s+/).every((parte) => conteudo.includes(parte))
    ) {
      return false;
    }

    const concluida = tarefa.status === "DONE";
    const data = tarefa.scheduledFor ?? tarefa.dueDate;
    if (filtro === "DONE") return concluida;
    if (filtro === "ALL") return true;
    if (concluida || !data) return false;
    if (filtro === "TODAY") return data === hoje;
    if (filtro === "UPCOMING") return data > hoje;
    return data < hoje;
  });
}
