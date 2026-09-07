import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { apiTreinos } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type {
  CreateWorkoutInput,
  UpdateWorkoutInput,
  Workout,
} from "@/types/api";

import { chavesTreinosUsuario } from "./workout-query-keys";

export { chaveTreinos } from "./workout-query-keys";

function sessaoTreinosEstaAtiva(userId?: string): boolean {
  const { estado, usuario } = useArmazenamentoAutenticacao.getState();
  return estado === "autenticado" && Boolean(userId) && usuario?.id === userId;
}

function invalidarListaTreinos(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTreinosEstaAtiva(userId)) return;
  const chaves = chavesTreinosUsuario(userId);
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chaves.lista,
  });
}

export function atualizarCacheEdicaoTreino(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  treino: Workout,
): void {
  if (!sessaoTreinosEstaAtiva(userId)) return;
  const chaves = chavesTreinosUsuario(userId);
  clienteConsultas.setQueryData(chaves.detalhe(treino.id), treino);
  invalidarListaTreinos(clienteConsultas, userId);
}

function removerCacheTreino(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  treinoId: string,
): void {
  if (!sessaoTreinosEstaAtiva(userId)) return;
  const chaves = chavesTreinosUsuario(userId);
  clienteConsultas.removeQueries({
    exact: true,
    queryKey: chaves.detalhe(treinoId),
  });
  invalidarListaTreinos(clienteConsultas, userId);
}

export function useListaTreinos(userId?: string) {
  const chaves = chavesTreinosUsuario(userId);
  return useQuery({
    queryKey: chaves.lista,
    queryFn: apiTreinos.listar,
    enabled: Boolean(userId),
  });
}

export function useCriarTreino(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CreateWorkoutInput) => apiTreinos.criar(entrada),
    onSuccess: () => invalidarListaTreinos(clienteConsultas, userId),
  });
}

export function useTreino(id?: string, userId?: string) {
  const chaves = chavesTreinosUsuario(userId);
  return useQuery({
    queryKey: chaves.detalhe(id ?? "sem-treino"),
    queryFn: () => apiTreinos.obter(id as string),
    enabled: Boolean(id) && Boolean(userId),
  });
}

export function useEditarTreino(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: UpdateWorkoutInput }) =>
      apiTreinos.editar(id, entrada),
    onSuccess: (treino) => atualizarCacheEdicaoTreino(clienteConsultas, userId, treino),
  });
}

export function useExcluirTreino(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTreinos.excluir(id),
    onSuccess: (_, id) => removerCacheTreino(clienteConsultas, userId, id),
  });
}
