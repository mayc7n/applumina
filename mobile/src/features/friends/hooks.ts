import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiAmigos } from "@/lib/api/resources";

export const chaveAmigos = ["amigos"] as const;
const chaveListaAmigos = [...chaveAmigos, "lista"] as const;
const chaveSolicitacoesAmizade = [...chaveAmigos, "solicitacoes"] as const;

export function useListaAmigos(habilitada = true) {
  return useQuery({
    queryKey: chaveListaAmigos,
    queryFn: apiAmigos.listar,
    enabled: habilitada,
  });
}

export function useSolicitacoesAmizade(habilitada = true) {
  return useQuery({
    queryKey: chaveSolicitacoesAmizade,
    queryFn: apiAmigos.listarSolicitacoes,
    enabled: habilitada,
  });
}

export function useBuscarAmigos(busca: string, habilitada = true) {
  return useQuery({
    queryKey: [...chaveAmigos, "busca", busca],
    queryFn: () => apiAmigos.buscar(busca),
    enabled: habilitada && busca.length >= 2,
  });
}

export function useSolicitarAmizade() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiAmigos.solicitar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaveAmigos }),
  });
}

export function useAceitarAmizade() {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiAmigos.aceitar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaveAmigos }),
  });
}
