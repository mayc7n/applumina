import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";

import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type { SocialFeedItem, User } from "@/types/api";

import {
  confirmarCurtidaOtimista,
  prepararCurtidaOtimista,
  restaurarCurtidaOtimista,
} from "./hooks";
import { chavesAmigosUsuario } from "./friend-query-keys";

const usuario = { id: "user-a" } as User;
const item: SocialFeedItem = {
  id: "post-1",
  user: {
    id: "user-b",
    displayName: "Pessoa B",
    username: "pessoa_b",
    isOnline: false,
    streak: 0,
    friendshipStatus: "ACCEPTED",
  },
  type: "WORKOUT",
  title: "Treino",
  emoji: "🏋️",
  likeCount: 3,
  liked: false,
  createdAt: "2030-06-10T12:00:00Z",
};

describe("curtida otimista do feed", () => {
  let clienteConsultas: QueryClient;

  beforeEach(() => {
    clienteConsultas = new QueryClient();
    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario,
    });
    clienteConsultas.setQueryData(chavesAmigosUsuario(usuario.id).feed, [item]);
  });

  afterEach(() => {
    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "naoAutenticado",
      usuario: null,
    });
  });

  test("atualiza somente o post alvo e confirma a resposta do servidor", async () => {
    const contexto = await prepararCurtidaOtimista(clienteConsultas, usuario.id, {
      postId: item.id,
      liked: true,
    });
    const chave = chavesAmigosUsuario(usuario.id).feed;

    expect(clienteConsultas.getQueryData<SocialFeedItem[]>(chave)?.[0]).toMatchObject({
      liked: true,
      likeCount: 4,
    });

    confirmarCurtidaOtimista(clienteConsultas, contexto, {
      liked: true,
      likeCount: 4,
    });

    expect(clienteConsultas.getQueryData<SocialFeedItem[]>(chave)?.[0]).toMatchObject({
      liked: true,
      likeCount: 4,
    });
  });

  test("erro antigo não desfaz uma alternância mais nova do mesmo post", async () => {
    const contextoAntigo = await prepararCurtidaOtimista(
      clienteConsultas,
      usuario.id,
      { postId: item.id, liked: true },
    );
    const contextoNovo = await prepararCurtidaOtimista(
      clienteConsultas,
      usuario.id,
      { postId: item.id, liked: false },
    );

    restaurarCurtidaOtimista(clienteConsultas, contextoAntigo);

    expect(clienteConsultas.getQueryData<SocialFeedItem[]>(
      chavesAmigosUsuario(usuario.id).feed,
    )?.[0]).toMatchObject({ liked: false, likeCount: 3 });

    restaurarCurtidaOtimista(clienteConsultas, contextoNovo);

    expect(clienteConsultas.getQueryData<SocialFeedItem[]>(
      chavesAmigosUsuario(usuario.id).feed,
    )?.[0]).toMatchObject({ liked: false, likeCount: 3 });
  });
});
