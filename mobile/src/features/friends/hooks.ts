import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiAmigos } from "@/lib/api/resources";

import { chavesAmigosUsuario } from "./friend-query-keys";

export function useListaAmigos(userId?: string) {
  const chaves = chavesAmigosUsuario(userId);
  return useQuery({
    queryKey: chaves.lista,
    queryFn: apiAmigos.listar,
    enabled: Boolean(userId),
  });
}

export function useSolicitacoesAmizade(userId?: string) {
  const chaves = chavesAmigosUsuario(userId);
  return useQuery({
    queryKey: chaves.solicitacoes,
    queryFn: apiAmigos.listarSolicitacoes,
    enabled: Boolean(userId),
  });
}

export function useBuscarAmigos(busca: string, userId?: string) {
  const chaves = chavesAmigosUsuario(userId);
  return useQuery({
    queryKey: chaves.busca(busca),
    queryFn: () => apiAmigos.buscar(busca),
    enabled: Boolean(userId) && busca.length >= 2,
  });
}

export function useSolicitarAmizade(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.solicitar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useAceitarAmizade(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.aceitar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}
