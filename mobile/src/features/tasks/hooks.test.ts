import { afterEach, describe, expect, test } from "@jest/globals";
import type { InfiniteData } from "@tanstack/react-query";

import { clienteConsultas } from "@/providers/query-provider";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type { DashboardData, PagedResponse, Task, User } from "@/types/api";

import {
  atualizarCacheEdicaoTarefa,
  prepararAlternanciaOtimistaTarefa,
  restaurarAlternanciaOtimistaTarefa,
} from "./hooks";
import { chavesTarefasUsuario } from "./task-query-keys";

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

const outraTarefaA: Task = {
  ...tarefaA,
  id: "tarefa-2",
  title: "Tarefa preservada",
};

const listaA: InfiniteData<PagedResponse<Task>, number> = {
  pages: [
    {
      content: [tarefaA, outraTarefaA],
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0,
    },
  ],
  pageParams: [0],
};

const painelA: DashboardData = {
  todayTasks: [tarefaA, outraTarefaA],
  habits: [],
  todayCompletions: [],
  activeGoals: [],
  focusStats: { weeklyMins: 0 },
  streak: 0,
  longestStreak: 0,
  weeklyData: [],
  recentActivity: [],
  moodCheckedIn: false,
};

function autenticar(usuario: User): void {
  useArmazenamentoAutenticacao.setState({
    estado: "autenticado",
    usuario,
  });
}

describe("callbacks privados de tarefas", () => {
  afterEach(() => {
    clienteConsultas.clear();
    useArmazenamentoAutenticacao.setState({
      estado: "naoAutenticado",
      usuario: null,
    });
  });

  test("alterna imediatamente a tarefa nos caches existentes de lista, painel e detalhe", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);

    await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );

    const listaAtualizada = clienteConsultas.getQueryData<
      InfiniteData<PagedResponse<Task>, number>
    >(chaves.lista);
    const painelAtualizado = clienteConsultas.getQueryData<DashboardData>(
      chaves.painel,
    );

    expect(listaAtualizada?.pages[0]?.content).toEqual([
      { ...tarefaA, status: "DONE" },
      outraTarefaA,
    ]);
    expect(painelAtualizado?.todayTasks).toEqual([
      { ...tarefaA, status: "DONE" },
      outraTarefaA,
    ]);
    expect(clienteConsultas.getQueryData(chaves.detalhe(tarefaA.id))).toEqual({
      ...tarefaA,
      status: "DONE",
    });
  });

  test("não cria caches ausentes durante a alternância otimista", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);

    await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );

    expect(clienteConsultas.getQueryState(chaves.painel)).toBeUndefined();
    expect(
      clienteConsultas.getQueryState(chaves.detalhe(tarefaA.id)),
    ).toBeUndefined();
  });

  test("restaura literalmente os snapshots após falha da alternância", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);
    const snapshotLista = clienteConsultas.getQueryData(chaves.lista);
    const snapshotPainel = clienteConsultas.getQueryData(chaves.painel);
    const snapshotDetalhe = clienteConsultas.getQueryData(
      chaves.detalhe(tarefaA.id),
    );

    const contexto = await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );
    restaurarAlternanciaOtimistaTarefa(clienteConsultas, contexto);

    expect(clienteConsultas.getQueryData(chaves.lista)).toEqual(snapshotLista);
    expect(clienteConsultas.getQueryData(chaves.painel)).toEqual(snapshotPainel);
    expect(clienteConsultas.getQueryData(chaves.detalhe(tarefaA.id))).toEqual(
      snapshotDetalhe,
    );
  });

  test("não restaura snapshots de A depois que a sessão muda para B", async () => {
    const chavesA = chavesTarefasUsuario(usuarioA.id);
    const chavesB = chavesTarefasUsuario(usuarioB.id);
    const listaB: InfiniteData<PagedResponse<Task>, number> = {
      pages: [
        {
          content: [tarefaB],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
        },
      ],
      pageParams: [0],
    };
    const painelB: DashboardData = {
      ...painelA,
      todayTasks: [tarefaB],
    };
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chavesA.lista, listaA);
    clienteConsultas.setQueryData(chavesA.painel, painelA);
    clienteConsultas.setQueryData(chavesA.detalhe(tarefaA.id), tarefaA);
    const contextoA = await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );

    clienteConsultas.clear();
    autenticar(usuarioB);
    clienteConsultas.setQueryData(chavesB.lista, listaB);
    clienteConsultas.setQueryData(chavesB.painel, painelB);
    clienteConsultas.setQueryData(chavesB.detalhe(tarefaB.id), tarefaB);

    restaurarAlternanciaOtimistaTarefa(clienteConsultas, contextoA);

    expect(clienteConsultas.getQueryData(chavesA.lista)).toBeUndefined();
    expect(clienteConsultas.getQueryData(chavesA.painel)).toBeUndefined();
    expect(
      clienteConsultas.getQueryData(chavesA.detalhe(tarefaA.id)),
    ).toBeUndefined();
    expect(clienteConsultas.getQueryData(chavesB.lista)).toEqual(listaB);
    expect(clienteConsultas.getQueryData(chavesB.painel)).toEqual(painelB);
    expect(clienteConsultas.getQueryData(chavesB.detalhe(tarefaB.id))).toEqual(
      tarefaB,
    );
  });

  test("descarta resposta de edição de A após limpar cache e trocar para B", () => {
    const detalheA = ["tarefas", "usuario-a", "detalhe", tarefaA.id];
    const detalheB = ["tarefas", "usuario-b", "detalhe", tarefaB.id];
    const listaB = ["tarefas", "usuario-b", "lista"];
    const painelB = ["painel", "usuario-b"];

    autenticar(usuarioA);
    clienteConsultas.setQueryData(detalheA, tarefaA);

    clienteConsultas.clear();
    autenticar(usuarioB);
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
