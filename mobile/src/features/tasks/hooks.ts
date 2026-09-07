import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { apiTarefas } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from "@/types/api";

import { chavesTarefasUsuario } from "./task-query-keys";

export {
  chaveEtiquetasTarefa,
  chavePainel,
  chaveProjetosTarefa,
  chaveTarefas,
} from "./task-query-keys";

function sessaoTarefasEstaAtiva(userId?: string): boolean {
  const { estado, usuario } = useArmazenamentoAutenticacao.getState();
  return estado === "autenticado" && Boolean(userId) && usuario?.id === userId;
}

function invalidarTarefasEPainel(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chaves.lista,
  });
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chaves.painel,
  });
}

export function atualizarCacheEdicaoTarefa(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefa: Task,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  clienteConsultas.setQueryData(chaves.detalhe(tarefa.id), tarefa);
  invalidarTarefasEPainel(clienteConsultas, userId);
}

function removerCacheTarefa(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefaId: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  clienteConsultas.removeQueries({
    exact: true,
    queryKey: chaves.detalhe(tarefaId),
  });
  invalidarTarefasEPainel(clienteConsultas, userId);
}

function invalidarProjetosTarefa(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chavesTarefasUsuario(userId).projetos,
  });
}

function invalidarEtiquetasTarefa(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chavesTarefasUsuario(userId).etiquetas,
  });
}

export function useListaTarefas(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useInfiniteQuery({
    queryKey: chaves.lista,
    queryFn: ({ pageParam }) => apiTarefas.listar(pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.number + 1 < ultimaPagina.totalPages
        ? ultimaPagina.number + 1
        : undefined,
    enabled: Boolean(userId),
  });
}

export function useCriarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CreateTaskInput) => apiTarefas.criar(entrada),
    onSuccess: () => invalidarTarefasEPainel(clienteConsultas, userId),
  });
}

export function useTarefa(id?: string, userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.detalhe(id ?? "sem-tarefa"),
    queryFn: () => apiTarefas.obter(id as string),
    enabled: Boolean(id) && Boolean(userId),
  });
}

export function useEditarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: UpdateTaskInput }) =>
      apiTarefas.editar(id, entrada),
    onSuccess: (tarefa) =>
      atualizarCacheEdicaoTarefa(clienteConsultas, userId, tarefa),
  });
}

export function useExcluirTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTarefas.excluir(id),
    onSuccess: (_, id) => removerCacheTarefa(clienteConsultas, userId, id),
  });
}

export function useAlternarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTarefas.alternarConclusao(id),
    onSuccess: (tarefa) =>
      atualizarCacheEdicaoTarefa(clienteConsultas, userId, tarefa),
  });
}

export function useProjetosTarefa(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.projetos,
    queryFn: apiTarefas.listarProjetos,
    enabled: Boolean(userId),
  });
}

export function useCriarProjetoTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarProjeto,
    onSuccess: () =>
      invalidarProjetosTarefa(clienteConsultas, userId),
  });
}

export function useEtiquetasTarefa(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.etiquetas,
    queryFn: apiTarefas.listarEtiquetas,
    enabled: Boolean(userId),
  });
}

export function useCriarEtiquetaTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarEtiqueta,
    onSuccess: () =>
      invalidarEtiquetasTarefa(clienteConsultas, userId),
  });
}
