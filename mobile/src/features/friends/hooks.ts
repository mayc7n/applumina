import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiAmigos } from "@/lib/api/resources";

import { chavesAmigosUsuario } from "./friend-query-keys";
import { reconciliarConflitoSolicitacaoAmizade } from "./friend-conflict";

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
    onError: (erro) =>
      reconciliarConflitoSolicitacaoAmizade(
        clienteConsultas,
        userId,
        erro,
      ),
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

export function useCancelarSolicitacaoAmizade(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.cancelar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useRejeitarSolicitacaoAmizade(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.rejeitar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useRemoverAmizade(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.remover,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useListaBloqueados(userId?: string) {
  const chaves = chavesAmigosUsuario(userId);
  return useQuery({
    queryKey: chaves.bloqueados,
    queryFn: apiAmigos.listarBloqueados,
    enabled: Boolean(userId),
  });
}

export function useBloquearUsuario(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.bloquear,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useDesbloquearUsuario(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.desbloquear,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}

export function useDenunciarUsuario(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation({
    mutationFn: apiAmigos.denunciar,
    onSuccess: () =>
      clienteConsultas.invalidateQueries({ queryKey: chaves.base }),
  });
}
