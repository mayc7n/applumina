import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiTreinos } from "@/lib/api/resources";
import type { CreateWorkoutInput } from "@/types/api";

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
