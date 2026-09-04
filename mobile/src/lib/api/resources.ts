import {
  atualizarParcialApi,
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
  TokenPair,
  User,
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

export const apiPainel = {
  obter: () => obterApi<DashboardData>("/analytics/dashboard"),
};

export const apiTarefas = {
  listar: () => obterApi<PagedResponse<Task>>("/tasks", { size: 100 }),
  criar: (entrada: CreateTaskInput) => enviarApi<Task>("/tasks", entrada),
  alternarConclusao: (id: string) =>
    atualizarParcialApi<Task>(`/tasks/${id}/complete`),
};
