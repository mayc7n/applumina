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
  ChangePasswordInput,
  DashboardData,
  DeleteAccountInput,
  ForgotPasswordInput,
  LoginInput,
  PagedResponse,
  RegisterInput,
  ResetPasswordInput,
  Task,
  TaskLabel,
  TaskProject,
  TokenPair,
  UpdateTaskInput,
  User,
  UserSession,
  Workout,
  CreateWorkoutInput,
  UpdateWorkoutInput,
  FriendRequest,
  SocialUser,
} from "@/types/api";

export const apiAutenticacaoMobile = {
  entrar: (entrada: LoginInput) =>
    enviarPublico<TokenPair>("/auth/mobile/login", entrada),
  cadastrar: (entrada: RegisterInput) =>
    enviarPublico<TokenPair>("/auth/mobile/register", entrada),
  solicitarRedefinicao: (entrada: ForgotPasswordInput) =>
    enviarPublico<void>("/auth/forgot-password", entrada),
  redefinirSenha: (entrada: ResetPasswordInput) =>
    enviarPublico<void>("/auth/reset-password", entrada),
  sair: (tokenRenovacao: string) =>
    enviarPublico<void>("/auth/mobile/logout", {
      refreshToken: tokenRenovacao,
    }),
};

export const apiUsuarios = {
  atual: () => obterApi<User>("/users/me"),
  alterarSenha: (entrada: ChangePasswordInput) =>
    atualizarParcialApi<void>("/users/me/password", entrada),
  excluir: (entrada: DeleteAccountInput) =>
    excluirApi("/users/me", entrada),
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

export const apiTreinos = {
  listar: () => obterApi<Workout[]>("/workouts"),
  obter: (id: string) => obterApi<Workout>(`/workouts/${id}`),
  criar: (entrada: CreateWorkoutInput) =>
    enviarApi<Workout>("/workouts", entrada),
  editar: (id: string, entrada: UpdateWorkoutInput) =>
    atualizarApi<Workout>(`/workouts/${id}`, entrada),
  excluir: (id: string) => excluirApi(`/workouts/${id}`),
};

export const apiAmigos = {
  listar: () => obterApi<SocialUser[]>("/social/friends"),
  listarSolicitacoes: () =>
    obterApi<FriendRequest[]>("/social/friends/requests"),
  buscar: (query: string) =>
    obterApi<SocialUser[]>("/social/users", { query }),
  solicitar: (userId: string) =>
    enviarApi<FriendRequest>("/social/friends/request", { userId }),
  aceitar: (requestId: string) =>
    enviarApi<void>(`/social/friends/request/${requestId}/accept`),
  cancelar: (friendId: string) =>
    excluirApi(`/social/friends/request/to/${friendId}`),
  rejeitar: (requestId: string) =>
    excluirApi(`/social/friends/request/${requestId}/reject`),
  remover: (friendId: string) => excluirApi(`/social/friends/${friendId}`),
};
