import type { Task } from "@/types/api";

export type FiltroTarefa =
  | "TODAY"
  | "PENDING"
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
    if (filtro === "ALL") return true;
    if (filtro === "PENDING") return !concluida;
    if (concluida || !data) return false;
    if (filtro === "TODAY") return data === hoje;
    return false;
  });
}
