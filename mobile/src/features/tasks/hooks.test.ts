import { afterEach, describe, expect, jest, test } from "@jest/globals";
import * as ReactQuery from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import { clienteConsultas } from "@/providers/query-provider";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type { DashboardData, PagedResponse, Task, User } from "@/types/api";

import {
  type ContextoAlternanciaOtimistaTarefa,
  atualizarCacheEdicaoTarefa,
  prepararAlternanciaOtimistaTarefa,
  restaurarAlternanciaOtimistaTarefa,
  useAlternarTarefa,
} from "./hooks";
import { chavesTarefasUsuario } from "./task-query-keys";

jest.mock("@tanstack/react-query", () => {
  const moduloReal = jest.requireActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...moduloReal,
    useMutation: jest.fn(),
    useQueryClient: jest.fn(),
  };
});

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

interface CallbacksAlternanciaTeste {
  onMutate: (
    tarefa: Task,
  ) => Promise<ContextoAlternanciaOtimistaTarefa>;
  onSuccess: (
    tarefa: Task,
    variaveis: Task,
    contexto: ContextoAlternanciaOtimistaTarefa,
  ) => void;
}

function CapturarCallbacksAlternanciaTeste(): CallbacksAlternanciaTeste {
  jest.mocked(ReactQuery.useQueryClient).mockReturnValue(clienteConsultas);
  jest
    .mocked(ReactQuery.useMutation)
    .mockImplementation((opcoes) => opcoes as never);
  return useAlternarTarefa(
    usuarioA.id,
  ) as unknown as CallbacksAlternanciaTeste;
}

describe("callbacks privados de tarefas", () => {
  afterEach(() => {
    jest.restoreAllMocks();
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

  test("alterna imediatamente DONE para TODO nos três caches", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    const tarefaConcluida = { ...tarefaA, status: "DONE" as const };
    const listaConcluida: InfiniteData<PagedResponse<Task>, number> = {
      ...listaA,
      pages: [
        {
          ...listaA.pages[0],
          content: [tarefaConcluida, outraTarefaA],
        },
      ],
    };
    const painelConcluido: DashboardData = {
      ...painelA,
      todayTasks: [tarefaConcluida, outraTarefaA],
    };
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaConcluida);
    clienteConsultas.setQueryData(chaves.painel, painelConcluido);
    clienteConsultas.setQueryData(
      chaves.detalhe(tarefaConcluida.id),
      tarefaConcluida,
    );

    await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaConcluida,
    );

    const listaAtualizada = clienteConsultas.getQueryData<
      InfiniteData<PagedResponse<Task>, number>
    >(chaves.lista);
    const painelAtualizado = clienteConsultas.getQueryData<DashboardData>(
      chaves.painel,
    );
    expect(listaAtualizada?.pages[0]?.content[0]?.status).toBe("TODO");
    expect(painelAtualizado?.todayTasks[0]?.status).toBe("TODO");
    expect(
      clienteConsultas.getQueryData<Task>(chaves.detalhe(tarefaConcluida.id))
        ?.status,
    ).toBe("TODO");
  });

  test("não cria lista, painel nem detalhe quando todos estão ausentes", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);

    const contexto = await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );
    restaurarAlternanciaOtimistaTarefa(clienteConsultas, contexto);

    expect(clienteConsultas.getQueryState(chaves.lista)).toBeUndefined();
    expect(clienteConsultas.getQueryState(chaves.painel)).toBeUndefined();
    expect(
      clienteConsultas.getQueryState(chaves.detalhe(tarefaA.id)),
    ).toBeUndefined();
  });

  test("restaura os três caches após falha sem mutações concorrentes", async () => {
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

  test("erro tardio de uma tarefa preserva o sucesso autoritativo de outra", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);
    clienteConsultas.setQueryData(
      chaves.detalhe(outraTarefaA.id),
      outraTarefaA,
    );

    const contextoFalhaA = await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );
    await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      outraTarefaA,
    );
    const tarefaBConfirmada = { ...outraTarefaA, status: "DONE" as const };
    atualizarCacheEdicaoTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaBConfirmada,
    );

    restaurarAlternanciaOtimistaTarefa(clienteConsultas, contextoFalhaA);

    const listaAtualizada = clienteConsultas.getQueryData<
      InfiniteData<PagedResponse<Task>, number>
    >(chaves.lista);
    const painelAtualizado = clienteConsultas.getQueryData<DashboardData>(
      chaves.painel,
    );
    expect(listaAtualizada?.pages[0]?.content.map(({ id, status }) => ({
      id,
      status,
    }))).toEqual([
      { id: tarefaA.id, status: "TODO" },
      { id: outraTarefaA.id, status: "DONE" },
    ]);
    expect(painelAtualizado?.todayTasks.map(({ id, status }) => ({
      id,
      status,
    }))).toEqual([
      { id: tarefaA.id, status: "TODO" },
      { id: outraTarefaA.id, status: "DONE" },
    ]);
    expect(
      clienteConsultas.getQueryData(chaves.detalhe(outraTarefaA.id)),
    ).toEqual(tarefaBConfirmada);
  });

  test("erro tardio não desfaz alternância mais nova da mesma tarefa", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);

    const contextoAntigo = await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaA,
    );
    const tarefaDepoisDaPrimeiraAlternancia = {
      ...tarefaA,
      status: "DONE" as const,
    };
    await prepararAlternanciaOtimistaTarefa(
      clienteConsultas,
      usuarioA.id,
      tarefaDepoisDaPrimeiraAlternancia,
    );
    const tarefaAutoritativa = {
      ...tarefaDepoisDaPrimeiraAlternancia,
      updatedAt: "2030-01-02T00:00:00Z",
    };
    const listaAutoritativa: InfiniteData<PagedResponse<Task>, number> = {
      ...listaA,
      pages: [
        {
          ...listaA.pages[0],
          content: [tarefaAutoritativa, outraTarefaA],
        },
      ],
    };
    const painelAutoritativo: DashboardData = {
      ...painelA,
      todayTasks: [tarefaAutoritativa, outraTarefaA],
    };
    clienteConsultas.setQueryData(chaves.lista, listaAutoritativa);
    clienteConsultas.setQueryData(chaves.painel, painelAutoritativo);
    clienteConsultas.setQueryData(
      chaves.detalhe(tarefaA.id),
      tarefaAutoritativa,
    );

    restaurarAlternanciaOtimistaTarefa(clienteConsultas, contextoAntigo);

    expect(clienteConsultas.getQueryData(chaves.lista)).toEqual(
      listaAutoritativa,
    );
    expect(clienteConsultas.getQueryData(chaves.painel)).toEqual(
      painelAutoritativo,
    );
    expect(clienteConsultas.getQueryData(chaves.detalhe(tarefaA.id))).toEqual(
      tarefaAutoritativa,
    );
  });

  test("sucesso antigo não sobrescreve alternância mais nova ainda pendente", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);
    const callbacks = CapturarCallbacksAlternanciaTeste();

    const contextoAntigo = await callbacks.onMutate(tarefaA);
    const tarefaDepoisDaPrimeiraAlternancia = clienteConsultas.getQueryData<Task>(
      chaves.detalhe(tarefaA.id),
    ) as Task;
    await callbacks.onMutate(tarefaDepoisDaPrimeiraAlternancia);
    const estadoOtimistaNovo = clienteConsultas.getQueryData<Task>(
      chaves.detalhe(tarefaA.id),
    );
    const respostaAntiga = {
      ...tarefaDepoisDaPrimeiraAlternancia,
      updatedAt: "2030-01-02T00:00:00Z",
    };

    callbacks.onSuccess(respostaAntiga, tarefaA, contextoAntigo);

    expect(clienteConsultas.getQueryData(chaves.detalhe(tarefaA.id))).toEqual(
      estadoOtimistaNovo,
    );
    expect(clienteConsultas.getQueryState(chaves.lista)?.isInvalidated).toBe(
      false,
    );
    expect(clienteConsultas.getQueryState(chaves.painel)?.isInvalidated).toBe(
      false,
    );
  });

  test("sucesso da versão vigente atualiza detalhe e invalida lista e painel", async () => {
    const chaves = chavesTarefasUsuario(usuarioA.id);
    autenticar(usuarioA);
    clienteConsultas.setQueryData(chaves.lista, listaA);
    clienteConsultas.setQueryData(chaves.painel, painelA);
    clienteConsultas.setQueryData(chaves.detalhe(tarefaA.id), tarefaA);
    const callbacks = CapturarCallbacksAlternanciaTeste();
    const contexto = await callbacks.onMutate(tarefaA);
    const respostaVigente = {
      ...tarefaA,
      status: "DONE" as const,
      updatedAt: "2030-01-03T00:00:00Z",
    };

    callbacks.onSuccess(respostaVigente, tarefaA, contexto);

    expect(clienteConsultas.getQueryData(chaves.detalhe(tarefaA.id))).toEqual(
      respostaVigente,
    );
    expect(clienteConsultas.getQueryState(chaves.lista)?.isInvalidated).toBe(
      true,
    );
    expect(clienteConsultas.getQueryState(chaves.painel)?.isInvalidated).toBe(
      true,
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
