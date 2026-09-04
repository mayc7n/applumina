import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiTarefas } from "@/lib/api/resources";
import type {
  CreateTaskInput,
  DashboardData,
  PagedResponse,
  Task,
} from "@/types/api";

export const chaveTarefas = ["tarefas"] as const;
export const chavePainel = ["painel"] as const;

function alternarTarefa(tarefa: Task): Task {
  const concluida = tarefa.status === "DONE";
  return {
    ...tarefa,
    status: concluida ? "TODO" : "DONE",
    completedAt: concluida ? undefined : new Date().toISOString(),
  };
}

export function useListaTarefas(habilitada = true) {
  return useQuery({
    queryKey: chaveTarefas,
    queryFn: apiTarefas.listar,
    enabled: habilitada,
  });
}

export function useCriarTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CreateTaskInput) => apiTarefas.criar(entrada),
    onSuccess: () => {
      void clienteConsultas.invalidateQueries({ queryKey: chaveTarefas });
      void clienteConsultas.invalidateQueries({ queryKey: chavePainel });
    },
  });
}

export function useAlternarTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTarefas.alternarConclusao(id),
    onMutate: async (id) => {
      await Promise.all([
        clienteConsultas.cancelQueries({ queryKey: chaveTarefas }),
        clienteConsultas.cancelQueries({ queryKey: chavePainel }),
      ]);
      const paginaAnterior =
        clienteConsultas.getQueryData<PagedResponse<Task>>(chaveTarefas);
      const painelAnterior =
        clienteConsultas.getQueryData<DashboardData>(chavePainel);

      clienteConsultas.setQueryData<PagedResponse<Task>>(
        chaveTarefas,
        (pagina) =>
          pagina
            ? {
                ...pagina,
                content: pagina.content.map((tarefa) =>
                  tarefa.id === id ? alternarTarefa(tarefa) : tarefa,
                ),
              }
            : pagina,
      );
      clienteConsultas.setQueryData<DashboardData>(chavePainel, (painel) =>
        painel
          ? {
              ...painel,
              todayTasks: painel.todayTasks.map((tarefa) =>
                tarefa.id === id ? alternarTarefa(tarefa) : tarefa,
              ),
            }
          : painel,
      );
      return { paginaAnterior, painelAnterior };
    },
    onError: (_erro, _id, contexto) => {
      if (contexto?.paginaAnterior) {
        clienteConsultas.setQueryData(chaveTarefas, contexto.paginaAnterior);
      }
      if (contexto?.painelAnterior) {
        clienteConsultas.setQueryData(chavePainel, contexto.painelAnterior);
      }
    },
    onSettled: () => {
      void clienteConsultas.invalidateQueries({ queryKey: chaveTarefas });
      void clienteConsultas.invalidateQueries({ queryKey: chavePainel });
    },
  });
}
