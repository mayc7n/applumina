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

const versoesAlternanciaTarefa = new WeakMap<
  QueryClient,
  Map<string, symbol>
>();

function chaveVersaoAlternancia(
  userId: string | undefined,
  tarefaId: string,
): string {
  return JSON.stringify([userId, tarefaId]);
}

function registrarVersaoAlternancia(
  clienteConsultas: QueryClient,
  userId: string | undefined,
  tarefaId: string,
): symbol {
  const versoes =
    versoesAlternanciaTarefa.get(clienteConsultas) ?? new Map<string, symbol>();
  const versao = Symbol(tarefaId);
  versoes.set(chaveVersaoAlternancia(userId, tarefaId), versao);
  versoesAlternanciaTarefa.set(clienteConsultas, versoes);
  return versao;
}

function finalizarVersaoAlternancia(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa | undefined,
): void {
  if (!contexto?.versao) return;
  const versoes = versoesAlternanciaTarefa.get(clienteConsultas);
  const chave = chaveVersaoAlternancia(contexto.userId, contexto.tarefaId);
  if (versoes?.get(chave) !== contexto.versao) return;
  versoes.delete(chave);
  if (versoes.size === 0) versoesAlternanciaTarefa.delete(clienteConsultas);
}

function versaoAlternanciaEstaAtiva(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa,
): boolean {
  return (
    contexto.versao !== undefined &&
    versoesAlternanciaTarefa
      .get(clienteConsultas)
      ?.get(chaveVersaoAlternancia(contexto.userId, contexto.tarefaId)) ===
      contexto.versao
  );
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
  const contexto: ContextoAlternanciaOtimistaTarefa = {
    userId,
    tarefaId: tarefa.id,
    versao: registrarVersaoAlternancia(clienteConsultas, userId, tarefa.id),
    statusLista: obterStatusTarefaLista(lista, tarefa.id),
    statusPainel: obterStatusTarefaPainel(painel, tarefa.id),
    statusDetalhe: detalhe?.status,
  };

  clienteConsultas.setQueryData<InfiniteData<PagedResponse<Task>, number>>(
    chaves.lista,
    (lista) =>
      lista
        ? {
            ...lista,
            pages: lista.pages.map((pagina) => ({
              ...pagina,
              content: pagina.content.map((item) =>
                alternarStatusTarefa(item, tarefa.id),
              ),
            })),
          }
        : undefined,
  );
  clienteConsultas.setQueryData<DashboardData>(chaves.painel, (painel) =>
    painel
      ? {
          ...painel,
          todayTasks: painel.todayTasks.map((item) =>
            alternarStatusTarefa(item, tarefa.id),
          ),
        }
      : undefined,
  );
  clienteConsultas.setQueryData<Task>(chaves.detalhe(tarefa.id), (detalhe) =>
    detalhe ? alternarStatusTarefa(detalhe, tarefa.id) : undefined,
  );

  return contexto;
}

export function restaurarAlternanciaOtimistaTarefa(
  clienteConsultas: QueryClient,
  contexto: ContextoAlternanciaOtimistaTarefa | undefined,
): void {
  if (
    !contexto ||
    !sessaoTarefasEstaAtiva(contexto.userId) ||
    !versaoAlternanciaEstaAtiva(clienteConsultas, contexto)
  ) {
    return;
  }
  const chaves = chavesTarefasUsuario(contexto.userId);

  const { statusLista, statusPainel, statusDetalhe } = contexto;
  if (statusLista !== undefined) {
    clienteConsultas.setQueryData<InfiniteData<PagedResponse<Task>, number>>(
      chaves.lista,
      (lista) =>
        lista
          ? {
              ...lista,
              pages: lista.pages.map((pagina) => ({
                ...pagina,
                content: pagina.content.map((item) =>
                  definirStatusTarefa(
                    item,
                    contexto.tarefaId,
                    statusLista,
                  ),
                ),
              })),
            }
          : undefined,
    );
  }
  if (statusPainel !== undefined) {
    clienteConsultas.setQueryData<DashboardData>(chaves.painel, (painel) =>
      painel
        ? {
            ...painel,
            todayTasks: painel.todayTasks.map((item) =>
              definirStatusTarefa(
                item,
                contexto.tarefaId,
                statusPainel,
              ),
            ),
          }
        : undefined,
    );
  }
  if (statusDetalhe !== undefined) {
    clienteConsultas.setQueryData<Task>(
      chaves.detalhe(contexto.tarefaId),
      (detalhe) =>
        detalhe
          ? definirStatusTarefa(
              detalhe,
              contexto.tarefaId,
              statusDetalhe,
            )
          : undefined,
    );
  }
  finalizarVersaoAlternancia(clienteConsultas, contexto);
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
    onSuccess: (tarefa) =>
      atualizarCacheEdicaoTarefa(clienteConsultas, userId, tarefa),
    onSettled: (_tarefa, _erro, _variaveis, contexto) =>
      finalizarVersaoAlternancia(clienteConsultas, contexto),
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
