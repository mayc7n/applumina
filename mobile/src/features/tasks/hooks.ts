import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiTarefas } from "@/lib/api/resources";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/api";

export const chaveTarefas = ["tarefas"] as const;
export const chavePainel = ["painel"] as const;
export const chaveProjetosTarefa = ["projetos-tarefa"] as const;
export const chaveEtiquetasTarefa = ["etiquetas-tarefa"] as const;

export function useListaTarefas(habilitada = true) {
  return useInfiniteQuery({
    queryKey: chaveTarefas,
    queryFn: ({ pageParam }) => apiTarefas.listar(pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.number + 1 < ultimaPagina.totalPages
        ? ultimaPagina.number + 1
        : undefined,
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

export function useTarefa(id?: string, habilitada = true) {
  return useQuery({
    queryKey: [...chaveTarefas, id],
    queryFn: () => apiTarefas.obter(id as string),
    enabled: Boolean(id) && habilitada,
  });
}

export function useEditarTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: UpdateTaskInput }) =>
      apiTarefas.editar(id, entrada),
    onSuccess: (tarefa) => {
      clienteConsultas.setQueryData([...chaveTarefas, tarefa.id], tarefa);
      void clienteConsultas.invalidateQueries({ queryKey: chaveTarefas });
      void clienteConsultas.invalidateQueries({ queryKey: chavePainel });
    },
  });
}

export function useExcluirTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTarefas.excluir(id),
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
    onSuccess: () => {
      void clienteConsultas.invalidateQueries({ queryKey: chaveTarefas });
      void clienteConsultas.invalidateQueries({ queryKey: chavePainel });
    },
  });
}

export function useProjetosTarefa(habilitada = true) {
  return useQuery({
    queryKey: chaveProjetosTarefa,
    queryFn: apiTarefas.listarProjetos,
    enabled: habilitada,
  });
}

export function useCriarProjetoTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarProjeto,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaveProjetosTarefa }),
  });
}

export function useEtiquetasTarefa(habilitada = true) {
  return useQuery({
    queryKey: chaveEtiquetasTarefa,
    queryFn: apiTarefas.listarEtiquetas,
    enabled: habilitada,
  });
}

export function useCriarEtiquetaTarefa() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarEtiqueta,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaveEtiquetasTarefa }),
  });
}
