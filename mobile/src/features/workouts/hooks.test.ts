import { afterEach, describe, expect, test } from "@jest/globals";

import { clienteConsultas } from "@/providers/query-provider";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type { User, Workout } from "@/types/api";

import { atualizarCacheEdicaoTreino } from "./hooks";

const usuarioA: User = {
  id: "usuario-a",
  email: "a@lumina.app",
  username: "usuario_a",
  displayName: "Usuário A",
  timezone: "America/Sao_Paulo",
  locale: "pt-BR",
  status: "ACTIVE",
  role: "USER",
  plan: "FREE",
  emailVerified: true,
  twoFactorEnabled: false,
  onboardingComplete: true,
  createdAt: "2030-01-01T00:00:00Z",
};

const usuarioB: User = {
  ...usuarioA,
  id: "usuario-b",
  email: "b@lumina.app",
  username: "usuario_b",
  displayName: "Usuário B",
};

const treinoA: Workout = {
  id: "workout-1",
  type: "RUNNING",
  activityDate: "2030-07-11",
  durationMins: 30,
  notes: "Resposta tardia de A",
  privacy: "PRIVATE",
};

const treinoB: Workout = {
  ...treinoA,
  durationMins: 45,
  notes: "Cache privado de B",
};

describe("cache privado de treinos", () => {
  afterEach(() => {
    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "naoAutenticado",
      usuario: null,
    });
  });

  test("descarta resposta de PUT de A após limpar cache e trocar para B", () => {
    const detalheA = ["treinos", "usuario-a", "detalhe", treinoA.id];
    const detalheB = ["treinos", "usuario-b", "detalhe", treinoB.id];
    const listaB = ["treinos", "usuario-b", "lista"];

    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario: usuarioA,
    });
    clienteConsultas.setQueryData(detalheA, treinoA);

    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario: usuarioB,
    });
    clienteConsultas.setQueryData(detalheB, treinoB);
    clienteConsultas.setQueryData(listaB, [treinoB]);

    atualizarCacheEdicaoTreino(clienteConsultas, usuarioA.id, treinoA);

    expect(clienteConsultas.getQueryData(detalheA)).toBeUndefined();
    expect(clienteConsultas.getQueryData(detalheB)).toEqual(treinoB);
    expect(clienteConsultas.getQueryData(listaB)).toEqual([treinoB]);
    expect(clienteConsultas.getQueryState(listaB)?.isInvalidated).toBe(false);
  });
});
