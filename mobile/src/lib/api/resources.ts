import {
  atualizarApi,
  atualizarParcialApi,
  excluirApi,
  enviarApi,
  enviarPublico,
  obterApi,
} from "./client";

import type {
  CreateTaskInput,
  DashboardData,
  LoginInput,
  PagedResponse,
  RegisterInput,
  Task,
  TaskLabel,
  TaskProject,
  TokenPair,
  UpdateTaskInput,
  User,
  UserSession,
} from "@/types/api";

export const apiAutenticacaoMobile = {
  entrar: (entrada: LoginInput) =>
    enviarPublico<TokenPair>("/auth/mobile/login", entrada),
  cadastrar: (entrada: RegisterInput) =>
    enviarPublico<TokenPair>("/auth/mobile/register", entrada),
  sair: (tokenRenovacao: string) =>
    enviarPublico<void>("/auth/mobile/logout", {
      refreshToken: tokenRenovacao,
    }),
};

export const apiUsuarios = {
  atual: () => obterApi<User>("/users/me"),
};

export const apiSessoes = {
  listar: () => obterApi<UserSession[]>("/auth/sessions"),
  encerrarOutras: () => excluirApi("/auth/sessions/others"),
  encerrar: (id: string) => excluirApi(`/auth/sessions/${id}`),
};

export const apiPainel = {
  obter: () => obterApi<DashboardData>("/analytics/dashboard"),
};

export const apiTarefas = {
  listar: (pagina = 0) =>
    obterApi<PagedResponse<Task>>("/tasks", { page: pagina, size: 50 }),
  obter: (id: string) => obterApi<Task>(`/tasks/${id}`),
  criar: (entrada: CreateTaskInput) => enviarApi<Task>("/tasks", entrada),
  editar: (id: string, entrada: UpdateTaskInput) =>
    atualizarApi<Task>(`/tasks/${id}`, entrada),
  excluir: (id: string) => excluirApi(`/tasks/${id}`),
  alternarConclusao: (id: string) =>
    atualizarParcialApi<Task>(`/tasks/${id}/complete`),
  listarProjetos: () => obterApi<TaskProject[]>("/tasks/projects"),
  criarProjeto: (name: string) =>
    enviarApi<TaskProject>("/tasks/projects", { name }),
  listarEtiquetas: () => obterApi<TaskLabel[]>("/tasks/labels"),
  criarEtiqueta: (name: string) =>
    enviarApi<TaskLabel>("/tasks/labels", { name }),
};
