import { create } from "zustand";

import { renovarTokenAcesso } from "@/lib/api/client";
import { apiAutenticacaoMobile, apiUsuarios } from "@/lib/api/resources";
import {
  limparSessao,
  obterTokenRenovacao,
  registrarAoExpirarSessao,
  salvarParTokens,
} from "@/lib/auth/session";
import { clienteConsultas } from "@/providers/query-provider";
import type {
  DeleteAccountInput,
  LoginInput,
  RegisterInput,
  TokenPair,
  User,
} from "@/types/api";

type EstadoAutenticacao = "inicializando" | "autenticado" | "naoAutenticado";

interface AuthState {
  estado: EstadoAutenticacao;
  usuario: User | null;
  inicializar: () => Promise<void>;
  entrar: (entrada: LoginInput) => Promise<void>;
  cadastrar: (entrada: RegisterInput) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: (entrada: DeleteAccountInput) => Promise<void>;
  marcarNaoAutenticado: () => void;
}

async function concluirAutenticacao(tokens: TokenPair): Promise<User> {
  if (tokens.requiresTwoFactor) {
    throw new Error(
      "A confirmação em duas etapas ainda precisa ser concluída.",
    );
  }
  await salvarParTokens(tokens);
  try {
    return await apiUsuarios.atual();
  } catch (erro) {
    await limparSessao();
    throw erro;
  }
}

function limparDadosPrivados(): void {
  clienteConsultas.clear();
}

export const useArmazenamentoAutenticacao = create<AuthState>((definir) => ({
  estado: "inicializando",
  usuario: null,

  inicializar: async () => {
    try {
      const refreshToken = await obterTokenRenovacao();
      if (!refreshToken) {
        limparDadosPrivados();
        definir({ estado: "naoAutenticado", usuario: null });
        return;
      }
      await renovarTokenAcesso();
      const usuario = await apiUsuarios.atual();
      limparDadosPrivados();
      definir({ estado: "autenticado", usuario });
    } catch {
      await limparSessao();
      limparDadosPrivados();
      definir({ estado: "naoAutenticado", usuario: null });
    }
  },

  entrar: async (entrada) => {
    const usuario = await concluirAutenticacao(
      await apiAutenticacaoMobile.entrar(entrada),
    );
    limparDadosPrivados();
    definir({ estado: "autenticado", usuario });
  },

  cadastrar: async (entrada) => {
    const usuario = await concluirAutenticacao(
      await apiAutenticacaoMobile.cadastrar(entrada),
    );
    limparDadosPrivados();
    definir({ estado: "autenticado", usuario });
  },

  sair: async () => {
    const refreshToken = await obterTokenRenovacao();
    try {
      if (refreshToken) await apiAutenticacaoMobile.sair(refreshToken);
    } finally {
      await limparSessao();
      limparDadosPrivados();
      definir({ estado: "naoAutenticado", usuario: null });
    }
  },

  excluirConta: async (entrada) => {
    await apiUsuarios.excluir(entrada);
    try {
      await limparSessao();
    } finally {
      limparDadosPrivados();
      definir({ estado: "naoAutenticado", usuario: null });
    }
  },

  marcarNaoAutenticado: () => {
    limparDadosPrivados();
    definir({ estado: "naoAutenticado", usuario: null });
  },
}));

registrarAoExpirarSessao(() =>
  useArmazenamentoAutenticacao.getState().marcarNaoAutenticado(),
);
