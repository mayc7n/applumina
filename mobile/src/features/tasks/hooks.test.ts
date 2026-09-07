import { afterEach, describe, expect, test } from "@jest/globals";

import { clienteConsultas } from "@/providers/query-provider";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type { Task, User } from "@/types/api";

import { atualizarCacheEdicaoTarefa } from "./hooks";

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

const tarefaA: Task = {
  id: "tarefa-1",
  title: "Resposta tardia de A",
  status: "TODO",
  priority: "NONE",
  labelIds: [],
  recurrenceType: "NONE",
  createdAt: "2030-01-01T00:00:00Z",
  updatedAt: "2030-01-01T00:00:00Z",
};

const tarefaB: Task = {
  ...tarefaA,
  title: "Cache privado de B",
};

describe("callbacks privados de tarefas", () => {
  afterEach(() => {
    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "naoAutenticado",
      usuario: null,
    });
  });

  test("descarta resposta de edição de A após limpar cache e trocar para B", () => {
    const detalheA = ["tarefas", "usuario-a", "detalhe", tarefaA.id];
    const detalheB = ["tarefas", "usuario-b", "detalhe", tarefaB.id];
    const listaB = ["tarefas", "usuario-b", "lista"];
    const painelB = ["painel", "usuario-b"];

    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario: usuarioA,
    });
    clienteConsultas.setQueryData(detalheA, tarefaA);

    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "autenticado",
      usuario: usuarioB,
    });
    clienteConsultas.setQueryData(detalheB, tarefaB);
    clienteConsultas.setQueryData(listaB, [tarefaB]);
    clienteConsultas.setQueryData(painelB, { todayTasks: [tarefaB] });

    atualizarCacheEdicaoTarefa(clienteConsultas, usuarioA.id, tarefaA);

    expect(clienteConsultas.getQueryData(detalheA)).toBeUndefined();
    expect(clienteConsultas.getQueryData(detalheB)).toEqual(tarefaB);
    expect(clienteConsultas.getQueryState(listaB)?.isInvalidated).toBe(false);
    expect(clienteConsultas.getQueryState(painelB)?.isInvalidated).toBe(false);
  });
});
