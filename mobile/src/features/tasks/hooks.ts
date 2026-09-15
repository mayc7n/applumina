import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";

import { apiTarefas } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import type {
  CreateTaskInput,
  DashboardData,
  PagedResponse,
  Task,
  UpdateTaskInput,
} from "@/types/api";

import { chavesTarefasUsuario } from "./task-query-keys";

export {
  chaveEtiquetasTarefa,
  chavePainel,
  chaveProjetosTarefa,
  chaveTarefas,
} from "./task-query-keys";

function sessaoTarefasEstaAtiva(userId?: string): boolean {
  const { estado, usuario } = useArmazenamentoAutenticacao.getState();
  return estado === "autenticado" && Boolean(userId) && usuario?.id === userId;
}

export interface ContextoAlternanciaOtimistaTarefa {
  userId: string | undefined;
  tarefaId: string;
  versao: symbol | undefined;
  statusLista: Task["status"] | undefined;
  statusPainel: Task["status"] | undefined;
  statusDetalhe: Task["status"] | undefined;
}

interface OperacaoAlternanciaOtimistaTarefa {
  versao: symbol;
  resposta: Task | undefined;
}

interface EstadoAlternanciaOtimistaTarefa {
  statusLista: Task["status"] | undefined;
  statusPainel: Task["status"] | undefined;
  statusDetalhe: Task["status"] | undefined;
  operacoes: OperacaoAlternanciaOtimistaTarefa[];
}

const estadosAlternanciaTarefa = new WeakMap<
  QueryClient,
  Map<string, EstadoAlternanciaOtimistaTarefa>
>();

function chaveVersaoAlternancia(
  userId: string | undefined,
  tarefaId: string,
): string {
  return JSON.stringify([userId, tarefaId]);
}

function obterEstadosAlternancia(
  clienteConsultas: QueryClient,
): Map<string, EstadoAlternanciaOtimistaTarefa> {
  const estados =
    estadosAlternanciaTarefa.get(clienteConsultas) ??
    new Map<string, EstadoAlternanciaOtimistaTarefa>();
  estadosAlternanciaTarefa.set(clienteConsultas, estados);
  return estados;
}

function alternarStatus(status: Task["status"]): Task["status"] {
  return status === "DONE" ? "TODO" : "DONE";
}

function obterStatusEsperado(
  estado: EstadoAlternanciaOtimistaTarefa,
  campo: "statusLista" | "statusPainel" | "statusDetalhe",
): Task["status"] | undefined {
  let status = estado[campo];
  for (const operacao of estado.operacoes) {
    status = operacao.resposta?.status ??
      (status === undefined ? undefined : alternarStatus(status));
  }
  return status;
}

function obterOperacaoAlternancia(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa | undefined,
): {
  estados: Map<string, EstadoAlternanciaOtimistaTarefa>;
  chave: string;
  estado: EstadoAlternanciaOtimistaTarefa;
  indice: number;
  operacao: OperacaoAlternanciaOtimistaTarefa;
} | undefined {
  if (!contexto?.versao) return undefined;
  const estados = estadosAlternanciaTarefa.get(clienteConsultas);
  const chave = chaveVersaoAlternancia(contexto.userId, contexto.tarefaId);
  const estado = estados?.get(chave);
  const indice = estado?.operacoes.findIndex(
    (operacao) => operacao.versao === contexto.versao,
  );
  const operacao =
    estado && indice !== undefined && indice >= 0
      ? estado.operacoes[indice]
      : undefined;
  if (!estado || indice === undefined || indice < 0 || !operacao) {
    return undefined;
  }
  return {
    estados: estados as Map<string, EstadoAlternanciaOtimistaTarefa>,
    chave,
    estado,
    indice,
    operacao,
  };
}

function alternarStatusTarefa(tarefa: Task, tarefaId: string): Task {
  if (tarefa.id !== tarefaId) return tarefa;
  return {
    ...tarefa,
    status: tarefa.status === "DONE" ? "TODO" : "DONE",
  };
}

function definirStatusTarefa(
  tarefa: Task,
  tarefaId: string,
  status: Task["status"],
): Task {
  if (tarefa.id !== tarefaId) return tarefa;
  return { ...tarefa, status };
}

function obterStatusTarefaLista(
  lista: InfiniteData<PagedResponse<Task>, number> | undefined,
  tarefaId: string,
): Task["status"] | undefined {
  for (const pagina of lista?.pages ?? []) {
    const tarefa = pagina.content.find((item) => item.id === tarefaId);
    if (tarefa) return tarefa.status;
  }
  return undefined;
}

function obterStatusTarefaPainel(
  painel: DashboardData | undefined,
  tarefaId: string,
): Task["status"] | undefined {
  return painel?.todayTasks.find((item) => item.id === tarefaId)?.status;
}

function aplicarStatusAlternancia(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefaId: string,
  statusAntes: {
    lista: Task["status"] | undefined;
    painel: Task["status"] | undefined;
    detalhe: Task["status"] | undefined;
  },
  statusDepois: {
    lista: Task["status"] | undefined;
    painel: Task["status"] | undefined;
    detalhe: Task["status"] | undefined;
  },
): void {
  const chaves = chavesTarefasUsuario(userId);
  const statusLista = statusDepois.lista ?? statusAntes.lista;
  const statusPainel = statusDepois.painel ?? statusAntes.painel;
  const statusDetalhe = statusDepois.detalhe ?? statusAntes.detalhe;
  if (statusAntes.lista !== undefined && statusLista !== undefined) {
    clienteConsultas.setQueryData<InfiniteData<PagedResponse<Task>, number>>(
      chaves.lista,
      (lista) =>
        lista &&
        obterStatusTarefaLista(lista, tarefaId) === statusAntes.lista
          ? {
              ...lista,
              pages: lista.pages.map((pagina) => ({
                ...pagina,
                content: pagina.content.map((item) =>
                  definirStatusTarefa(
                    item,
                    tarefaId,
                    statusLista,
                  ),
                ),
              })),
            }
          : lista,
    );
  }
  if (statusAntes.painel !== undefined && statusPainel !== undefined) {
    clienteConsultas.setQueryData<DashboardData>(chaves.painel, (painel) =>
      painel &&
      obterStatusTarefaPainel(painel, tarefaId) === statusAntes.painel
        ? {
            ...painel,
            todayTasks: painel.todayTasks.map((item) =>
              definirStatusTarefa(
                item,
                tarefaId,
                statusPainel,
              ),
            ),
          }
        : painel,
    );
  }
  if (statusAntes.detalhe !== undefined && statusDetalhe !== undefined) {
    clienteConsultas.setQueryData<Task>(
      chaves.detalhe(tarefaId),
      (detalhe) =>
        detalhe && detalhe.status === statusAntes.detalhe
          ? definirStatusTarefa(
              detalhe,
              tarefaId,
              statusDetalhe,
            )
          : detalhe,
    );
  }
}

export async function prepararAlternanciaOtimistaTarefa(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefa: Task,
): Promise<ContextoAlternanciaOtimistaTarefa> {
  const chaves = chavesTarefasUsuario(userId);

  if (!sessaoTarefasEstaAtiva(userId)) {
    return {
      userId,
      tarefaId: tarefa.id,
      versao: undefined,
      statusLista: undefined,
      statusPainel: undefined,
      statusDetalhe: undefined,
    };
  }

  await Promise.all([
    clienteConsultas.cancelQueries({ exact: true, queryKey: chaves.lista }),
    clienteConsultas.cancelQueries({ exact: true, queryKey: chaves.painel }),
    clienteConsultas.cancelQueries({
      exact: true,
      queryKey: chaves.detalhe(tarefa.id),
    }),
  ]);

  const lista = clienteConsultas.getQueryData<
    InfiniteData<PagedResponse<Task>, number>
  >(chaves.lista);
  const painel = clienteConsultas.getQueryData<DashboardData>(chaves.painel);
  const detalhe = clienteConsultas.getQueryData<Task>(
    chaves.detalhe(tarefa.id),
  );
  const chave = chaveVersaoAlternancia(userId, tarefa.id);
  const estados = obterEstadosAlternancia(clienteConsultas);
  const estado =
    estados.get(chave) ?? {
      statusLista: obterStatusTarefaLista(lista, tarefa.id),
      statusPainel: obterStatusTarefaPainel(painel, tarefa.id),
      statusDetalhe: detalhe?.status,
      operacoes: [],
    };
  const versao = Symbol(tarefa.id);
  const statusEsperadoAntes = {
    lista: obterStatusEsperado(estado, "statusLista"),
    painel: obterStatusEsperado(estado, "statusPainel"),
    detalhe: obterStatusEsperado(estado, "statusDetalhe"),
  };
  estado.operacoes.push({ versao, resposta: undefined });
  estados.set(chave, estado);
  const contexto: ContextoAlternanciaOtimistaTarefa = {
    userId,
    tarefaId: tarefa.id,
    versao,
    statusLista: estado.statusLista,
    statusPainel: estado.statusPainel,
    statusDetalhe: estado.statusDetalhe,
  };

  clienteConsultas.setQueryData<InfiniteData<PagedResponse<Task>, number>>(
    chaves.lista,
    (lista) =>
      lista &&
      obterStatusTarefaLista(lista, tarefa.id) === statusEsperadoAntes.lista
        ? {
            ...lista,
            pages: lista.pages.map((pagina) => ({
              ...pagina,
              content: pagina.content.map((item) =>
                alternarStatusTarefa(item, tarefa.id),
              ),
            })),
          }
        : lista,
  );
  clienteConsultas.setQueryData<DashboardData>(chaves.painel, (painel) =>
    painel &&
    obterStatusTarefaPainel(painel, tarefa.id) === statusEsperadoAntes.painel
      ? {
          ...painel,
          todayTasks: painel.todayTasks.map((item) =>
            alternarStatusTarefa(item, tarefa.id),
          ),
        }
      : painel,
  );
  clienteConsultas.setQueryData<Task>(chaves.detalhe(tarefa.id), (detalhe) =>
    detalhe && detalhe.status === statusEsperadoAntes.detalhe
      ? alternarStatusTarefa(detalhe, tarefa.id)
      : detalhe,
  );

  return contexto;
}

export function restaurarAlternanciaOtimistaTarefa(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa | undefined,
): void {
  if (
    !contexto ||
    !sessaoTarefasEstaAtiva(contexto.userId)
  ) {
    return;
  }
  const operacaoEncontrada = obterOperacaoAlternancia(
    clienteConsultas,
    contexto,
  );
  if (!operacaoEncontrada) return;
  const { estados, chave, estado, indice } = operacaoEncontrada;
  const statusEsperadoAntes = {
    lista: obterStatusEsperado(estado, "statusLista"),
    painel: obterStatusEsperado(estado, "statusPainel"),
    detalhe: obterStatusEsperado(estado, "statusDetalhe"),
  };
  estado.operacoes.splice(indice, 1);
  const statusEsperadoDepoisDaFalha = {
    lista: obterStatusEsperado(estado, "statusLista"),
    painel: obterStatusEsperado(estado, "statusPainel"),
    detalhe: obterStatusEsperado(estado, "statusDetalhe"),
  };
  aplicarStatusAlternancia(
    clienteConsultas,
    contexto.userId,
    contexto.tarefaId,
    statusEsperadoAntes,
    statusEsperadoDepoisDaFalha,
  );
  const respostaAnterior = [...estado.operacoes]
    .reverse()
    .find((operacao) => operacao.resposta)?.resposta;
  const possuiOperacaoPendente = estado.operacoes.some(
    (operacao) => operacao.resposta === undefined,
  );
  if (!possuiOperacaoPendente && respostaAnterior) {
    atualizarCacheEdicaoTarefa(
      clienteConsultas,
      contexto.userId,
      respostaAnterior,
    );
    estados.delete(chave);
  } else if (estado.operacoes.length === 0) {
    estados.delete(chave);
  }
  if (estados.size === 0) estadosAlternanciaTarefa.delete(clienteConsultas);
}

function registrarSucessoAlternanciaOtimistaTarefa(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa | undefined,
  tarefa: Task,
): void {
  if (!contexto || !sessaoTarefasEstaAtiva(contexto.userId)) return;
  const operacaoEncontrada = obterOperacaoAlternancia(
    clienteConsultas,
    contexto,
  );
  if (!operacaoEncontrada) return;

  const { estados, chave, estado, operacao } = operacaoEncontrada;
  const statusEsperadoAntes = {
    lista: obterStatusEsperado(estado, "statusLista"),
    painel: obterStatusEsperado(estado, "statusPainel"),
    detalhe: obterStatusEsperado(estado, "statusDetalhe"),
  };
  operacao.resposta = tarefa;
  const statusEsperadoDepois = {
    lista: obterStatusEsperado(estado, "statusLista"),
    painel: obterStatusEsperado(estado, "statusPainel"),
    detalhe: obterStatusEsperado(estado, "statusDetalhe"),
  };
  aplicarStatusAlternancia(
    clienteConsultas,
    contexto.userId,
    contexto.tarefaId,
    statusEsperadoAntes,
    statusEsperadoDepois,
  );

  if (
    estado.operacoes.some((operacaoAtual) => operacaoAtual.resposta === undefined)
  ) {
    return;
  }
  atualizarCacheEdicaoTarefa(clienteConsultas, contexto.userId, tarefa);
  estados.delete(chave);
  if (estados.size === 0) estadosAlternanciaTarefa.delete(clienteConsultas);
}

function invalidarTarefasEPainel(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chaves.lista,
  });
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chaves.painel,
  });
}

export function atualizarCacheEdicaoTarefa(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefa: Task,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  clienteConsultas.setQueryData(chaves.detalhe(tarefa.id), tarefa);
  invalidarTarefasEPainel(clienteConsultas, userId);
}

function removerCacheTarefa(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefaId: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  const chaves = chavesTarefasUsuario(userId);
  clienteConsultas.removeQueries({
    exact: true,
    queryKey: chaves.detalhe(tarefaId),
  });
  invalidarTarefasEPainel(clienteConsultas, userId);
}

function invalidarProjetosTarefa(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chavesTarefasUsuario(userId).projetos,
  });
}

function invalidarEtiquetasTarefa(
  clienteConsultas: QueryClient,
  userId?: string,
): void {
  if (!sessaoTarefasEstaAtiva(userId)) return;
  void clienteConsultas.invalidateQueries({
    exact: true,
    queryKey: chavesTarefasUsuario(userId).etiquetas,
  });
}

export function useListaTarefas(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useInfiniteQuery({
    queryKey: chaves.lista,
    queryFn: ({ pageParam }) => apiTarefas.listar(pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.number + 1 < ultimaPagina.totalPages
        ? ultimaPagina.number + 1
        : undefined,
    enabled: Boolean(userId),
  });
}

export function useCriarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (entrada: CreateTaskInput) => apiTarefas.criar(entrada),
    onSuccess: () => invalidarTarefasEPainel(clienteConsultas, userId),
  });
}

export function useTarefa(id?: string, userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.detalhe(id ?? "sem-tarefa"),
    queryFn: () => apiTarefas.obter(id as string),
    enabled: Boolean(id) && Boolean(userId),
  });
}

export function useEditarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entrada }: { id: string; entrada: UpdateTaskInput }) =>
      apiTarefas.editar(id, entrada),
    onSuccess: (tarefa) =>
      atualizarCacheEdicaoTarefa(clienteConsultas, userId, tarefa),
  });
}

export function useExcluirTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiTarefas.excluir(id),
    onSuccess: (_, id) => removerCacheTarefa(clienteConsultas, userId, id),
  });
}

export function useAlternarTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: (tarefa: Task) => apiTarefas.alternarConclusao(tarefa.id),
    onMutate: (tarefa) =>
      prepararAlternanciaOtimistaTarefa(clienteConsultas, userId, tarefa),
    onError: (_erro, _tarefa, contexto) =>
      restaurarAlternanciaOtimistaTarefa(clienteConsultas, contexto),
    onSuccess: (tarefa, _variaveis, contexto) =>
      registrarSucessoAlternanciaOtimistaTarefa(
        clienteConsultas,
        contexto,
        tarefa,
      ),
  });
}

export function useProjetosTarefa(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.projetos,
    queryFn: apiTarefas.listarProjetos,
    enabled: Boolean(userId),
  });
}

export function useCriarProjetoTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarProjeto,
    onSuccess: () =>
      invalidarProjetosTarefa(clienteConsultas, userId),
  });
}

export function useEtiquetasTarefa(userId?: string) {
  const chaves = chavesTarefasUsuario(userId);
  return useQuery({
    queryKey: chaves.etiquetas,
    queryFn: apiTarefas.listarEtiquetas,
    enabled: Boolean(userId),
  });
}

export function useCriarEtiquetaTarefa(userId?: string) {
  const clienteConsultas = useQueryClient();
  return useMutation({
    mutationFn: apiTarefas.criarEtiqueta,
    onSuccess: () =>
      invalidarEtiquetasTarefa(clienteConsultas, userId),
  });
}
