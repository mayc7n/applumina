import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiTreinos } from "@/lib/api/resources";
import type { CreateWorkoutInput, UpdateWorkoutInput } from "@/types/api";

export const chaveTreinos = ["treinos"] as const;

export function useListaTreinos(habilitada = true) {
  return useQuery({
    queryKey: chaveTreinos,
    queryFn: apiTreinos.listar,
    enabled: habilitada,
  });
}

export function useCriarTreino() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CreateWorkoutInput) => apiTreinos.criar(entrada),
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaveTreinos }),
  });
}

export function useTreino(id?: string, habilitada = true) {
  return useQuery({
    queryKey: [...chaveTreinos, id],
    queryFn: () => apiTreinos.obter(id as string),
    enabled: Boolean(id) && habilitada,
  });
}

export function useEditarTreino() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: UpdateWorkoutInput }) =>
      apiTreinos.editar(id, entrada),
    onSuccess: (treino) => {
      clienteConsultas.setQueryData([...chaveTreinos, treino.id], treino);
      void clienteConsultas.invalidateQueries({ queryKey: chaveTreinos });
    },
  });
}

export function useExcluirTreino() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTreinos.excluir(id),
    onSuccess: (_, id) => {
      clienteConsultas.removeQueries({ queryKey: [...chaveTreinos, id] });
      void clienteConsultas.invalidateQueries({ queryKey: chaveTreinos });
    },
  });
}
