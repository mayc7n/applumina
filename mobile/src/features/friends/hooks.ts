import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiAmigos } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

import { chavesAmigosUsuario } from "./friend-query-keys";
import { reconciliarConflitoSolicitacaoAmizade } from "./friend-conflict";
import type { SocialFeedItem, SocialLikeResponse } from "@/types/api";

function sessaoAmigosEstaAtiva(userId?: string): boolean {
  const { estado, usuario } = useArmazenamentoAutenticacao.getState();
  return estado === "autenticado" && Boolean(userId) && usuario?.id === userId;
}

type EstadoCurtida = Pick<SocialFeedItem, "liked" | "likeCount">;

interface OperacaoCurtida {
  versao: symbol;
  estado: EstadoCurtida;
}

interface EstadoOtimistaCurtida {
  base: EstadoCurtida;
  operacoes: OperacaoCurtida[];
}

export interface ContextoCurtidaOtimista {
  userId: string | undefined;
  postId: string;
  versao: symbol | undefined;
}

export interface VariaveisCurtida {
  postId: string;
  liked: boolean;
}

const estadosCurtida = new WeakMap<
  ReturnType<typeof useQueryClient>,
  Map<string, EstadoOtimistaCurtida>
>();

function chaveEstadoCurtida(userId: string | undefined, postId: string): string {
  return JSON.stringify([userId, postId]);
}

function obterEstadosCurtida(
  clienteConsultas: ReturnType<typeof useQueryClient>,
): Map<string, EstadoOtimistaCurtida> {
  const estados =
    estadosCurtida.get(clienteConsultas) ?? new Map<string, EstadoOtimistaCurtida>();
  estadosCurtida.set(clienteConsultas, estados);
  return estados;
}

function obterEstadoAtualCurtida(estado: EstadoOtimistaCurtida): EstadoCurtida {
  return estado.operacoes.at(-1)?.estado ?? estado.base;
}

function atualizarItemFeed(
  clienteConsultas: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  postId: string,
  esperado: EstadoCurtida,
  proximo: EstadoCurtida,
): void {
  const chave = chavesAmigosUsuario(userId).feed;
  clienteConsultas.setQueryData<SocialFeedItem[]>(chave, (feed) => {
    if (!feed) return feed;
    return feed.map((item) =>
      item.id === postId &&
      item.liked === esperado.liked &&
      item.likeCount === esperado.likeCount
        ? { ...item, ...proximo }
        : item,
    );
  });
}

export async function prepararCurtidaOtimista(
  clienteConsultas: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  variaveis: VariaveisCurtida,
): Promise<ContextoCurtidaOtimista> {
  const contextoBase = { userId, postId: variaveis.postId, versao: undefined };
  if (!sessaoAmigosEstaAtiva(userId)) return contextoBase;

  const chave = chavesAmigosUsuario(userId).feed;
  await clienteConsultas.cancelQueries({ exact: true, queryKey: chave });
  const item = clienteConsultas
    .getQueryData<SocialFeedItem[]>(chave)
    ?.find((feedItem) => feedItem.id === variaveis.postId);
  if (!item) return contextoBase;

  const estados = obterEstadosCurtida(clienteConsultas);
  const chaveEstado = chaveEstadoCurtida(userId, variaveis.postId);
  const estado =
    estados.get(chaveEstado) ?? {
      base: { liked: item.liked, likeCount: item.likeCount },
      operacoes: [],
    };
  const atual = obterEstadoAtualCurtida(estado);
  const proximo: EstadoCurtida = {
    liked: variaveis.liked,
    likeCount:
      atual.likeCount +
      (atual.liked === variaveis.liked ? 0 : variaveis.liked ? 1 : -1),
  };
  const versao = Symbol("curtida");
  estado.operacoes.push({ versao, estado: proximo });
  estados.set(chaveEstado, estado);
  atualizarItemFeed(clienteConsultas, userId, variaveis.postId, atual, proximo);
  return { userId, postId: variaveis.postId, versao };
}

function finalizarCurtida(
  clienteConsultas: ReturnType<typeof useQueryClient>,
  contexto: ContextoCurtidaOtimista | undefined,
  resposta: SocialLikeResponse | undefined,
): void {
  if (!contexto?.versao) return;
  const estados = estadosCurtida.get(clienteConsultas);
  const chaveEstado = chaveEstadoCurtida(contexto.userId, contexto.postId);
  const estado = estados?.get(chaveEstado);
  const indice = estado?.operacoes.findIndex((operacao) => operacao.versao === contexto.versao);
  if (!estado || indice === undefined || indice < 0) return;

  const esperado = obterEstadoAtualCurtida(estado);
  if (resposta) estado.base = resposta;
  estado.operacoes.splice(indice, 1);
  const proximo = obterEstadoAtualCurtida(estado);
  if (sessaoAmigosEstaAtiva(contexto.userId)) {
    atualizarItemFeed(clienteConsultas, contexto.userId, contexto.postId, esperado, proximo);
  }
  if (estado.operacoes.length === 0) estados?.delete(chaveEstado);
}

export function confirmarCurtidaOtimista(
  clienteConsultas: ReturnType<typeof useQueryClient>,
  contexto: ContextoCurtidaOtimista | undefined,
  resposta: SocialLikeResponse,
): void {
  finalizarCurtida(clienteConsultas, contexto, resposta);
}

export function restaurarCurtidaOtimista(
  clienteConsultas: ReturnType<typeof useQueryClient>,
  contexto: ContextoCurtidaOtimista | undefined,
): void {
  finalizarCurtida(clienteConsultas, contexto, undefined);
}

export function useFeedSocial(userId?: string) {
  const chaves = chavesAmigosUsuario(userId);
  return useQuery({
    queryKey: chaves.feed,
    queryFn: apiAmigos.feed,
    enabled: Boolean(userId),
  });
}

export function useCurtirPost(userId?: string) {
  const clienteConsultas = useQueryClient();
  const chaves = chavesAmigosUsuario(userId);
  return useMutation<SocialLikeResponse, Error, VariaveisCurtida, ContextoCurtidaOtimista>({
    mutationFn: ({ postId, liked }) =>
      liked ? apiAmigos.curtir(postId) : apiAmigos.descurtir(postId),
    onMutate: (variaveis) =>
      prepararCurtidaOtimista(clienteConsultas, userId, variaveis),
    onSuccess: (resposta, _variaveis, contexto) =>
      confirmarCurtidaOtimista(clienteConsultas, contexto, resposta),
    onError: (_erro, _variaveis, contexto) =>
      restaurarCurtidaOtimista(clienteConsultas, contexto),
    onSettled: () =>
      clienteConsultas.invalidateQueries({ exact: true, queryKey: chaves.feed }),
  });
}

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
