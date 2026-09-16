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
  IdiomaApp,
  LoginInput,
  RegisterInput,
  TokenPair,
  User,
} from "@/types/api";

type EstadoAutenticacao = "inicializando" | "autenticado" | "naoAutenticado";

interface AuthState {
  estado: EstadoAutenticacao;
  usuario: User | null;
  geracaoSessao: number;
  inicializar: () => Promise<void>;
  entrar: (entrada: LoginInput) => Promise<void>;
  cadastrar: (entrada: RegisterInput) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: (entrada: DeleteAccountInput) => Promise<void>;
  atualizarIdioma: (idioma: IdiomaApp) => void;
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
  geracaoSessao: 0,

  inicializar: async () => {
    try {
      const refreshToken = await obterTokenRenovacao();
      if (!refreshToken) {
        limparDadosPrivados();
        definir((atual) => ({
          estado: "naoAutenticado",
          usuario: null,
          geracaoSessao: atual.geracaoSessao + 1,
        }));
        return;
      }
      await renovarTokenAcesso();
      const usuario = await apiUsuarios.atual();
      limparDadosPrivados();
      definir((atual) => ({
        estado: "autenticado",
        usuario,
        geracaoSessao: atual.geracaoSessao + 1,
      }));
    } catch {
      await limparSessao();
      limparDadosPrivados();
      definir((atual) => ({
        estado: "naoAutenticado",
        usuario: null,
        geracaoSessao: atual.geracaoSessao + 1,
      }));
    }
  },

  entrar: async (entrada) => {
    const usuario = await concluirAutenticacao(
      await apiAutenticacaoMobile.entrar(entrada),
    );
    limparDadosPrivados();
    definir((atual) => ({
      estado: "autenticado",
      usuario,
      geracaoSessao: atual.geracaoSessao + 1,
    }));
  },

  cadastrar: async (entrada) => {
    const usuario = await concluirAutenticacao(
      await apiAutenticacaoMobile.cadastrar(entrada),
    );
    limparDadosPrivados();
    definir((atual) => ({
      estado: "autenticado",
      usuario,
      geracaoSessao: atual.geracaoSessao + 1,
    }));
  },

  sair: async () => {
    const refreshToken = await obterTokenRenovacao();
    try {
      if (refreshToken) await apiAutenticacaoMobile.sair(refreshToken);
    } finally {
      await limparSessao();
      limparDadosPrivados();
      definir((atual) => ({
        estado: "naoAutenticado",
        usuario: null,
        geracaoSessao: atual.geracaoSessao + 1,
      }));
    }
  },

  excluirConta: async (entrada) => {
    await apiUsuarios.excluir(entrada);
    try {
      await limparSessao();
    } finally {
      limparDadosPrivados();
      definir((atual) => ({
        estado: "naoAutenticado",
        usuario: null,
        geracaoSessao: atual.geracaoSessao + 1,
      }));
    }
  },

  atualizarIdioma: (idioma) =>
    definir((atual) => ({
      usuario: atual.usuario ? { ...atual.usuario, locale: idioma } : null,
    })),

  marcarNaoAutenticado: () => {
    limparDadosPrivados();
    definir((atual) => ({
      estado: "naoAutenticado",
      usuario: null,
      geracaoSessao: atual.geracaoSessao + 1,
    }));
  },
}));

registrarAoExpirarSessao(() =>
  useArmazenamentoAutenticacao.getState().marcarNaoAutenticado(),
);
