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
  versaoIdioma: number;
  idiomaSalvando: boolean;
  inicializar: () => Promise<void>;
  entrar: (entrada: LoginInput) => Promise<void>;
  cadastrar: (entrada: RegisterInput) => Promise<void>;
  sair: () => Promise<void>;
  excluirConta: (entrada: DeleteAccountInput) => Promise<void>;
  atualizarIdioma: (idioma: IdiomaApp) => void;
  finalizarAtualizacaoIdioma: () => void;
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

let versaoInicializacao = 0;

export const useArmazenamentoAutenticacao = create<AuthState>((definir, obter) => ({
  estado: "inicializando",
  usuario: null,
  geracaoSessao: 0,
  versaoIdioma: 0,
  idiomaSalvando: false,

  inicializar: async () => {
    const origem = obter();
    const versao = ++versaoInicializacao;
    const inicializacaoAtual = () =>
      versao === versaoInicializacao &&
      origem.geracaoSessao === obter().geracaoSessao &&
      origem.usuario?.id === obter().usuario?.id;

    try {
      const refreshToken = await obterTokenRenovacao();
      if (!inicializacaoAtual()) return;
      if (!refreshToken) {
        limparDadosPrivados();
        definir((atual) => ({
          estado: "naoAutenticado",
          usuario: null,
          geracaoSessao: atual.geracaoSessao + 1,
          idiomaSalvando: false,
        }));
        return;
      }
      await renovarTokenAcesso();
      if (!inicializacaoAtual()) return;
      const usuario = await apiUsuarios.atual();
      if (!inicializacaoAtual()) return;
      limparDadosPrivados();
      definir((atual) => {
        const mesmaSessao =
          atual.estado === "autenticado" && atual.usuario?.id === usuario.id;
        // Uma leitura que cruzou um PATCH não pode repor o locale anterior,
        // mesmo se a confirmação ou o rollback já tiverem terminado.
        const preservarIdioma = mesmaSessao && (
          origem.idiomaSalvando ||
          atual.idiomaSalvando ||
          origem.versaoIdioma !== atual.versaoIdioma
        );
        return {
          estado: "autenticado",
          usuario: preservarIdioma && atual.usuario
            ? { ...usuario, locale: atual.usuario.locale }
            : usuario,
          geracaoSessao: mesmaSessao ? atual.geracaoSessao : atual.geracaoSessao + 1,
          idiomaSalvando: mesmaSessao && atual.idiomaSalvando,
        };
      });
    } catch {
      if (!inicializacaoAtual()) return;
      await limparSessao();
      if (!inicializacaoAtual()) return;
      limparDadosPrivados();
      definir((atual) => ({
        estado: "naoAutenticado",
        usuario: null,
        geracaoSessao: atual.geracaoSessao + 1,
        idiomaSalvando: false,
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
      idiomaSalvando: false,
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
      idiomaSalvando: false,
    }));
  },

  sair: async () => {
    // Invalida imediatamente callbacks de operações da sessão que está saindo.
    definir((atual) => ({
      geracaoSessao: atual.geracaoSessao + 1,
    }));
    try {
      const refreshToken = await obterTokenRenovacao();
      if (refreshToken) await apiAutenticacaoMobile.sair(refreshToken);
    } finally {
      await limparSessao();
      limparDadosPrivados();
      definir((atual) => ({
        estado: "naoAutenticado",
        usuario: null,
        geracaoSessao: atual.geracaoSessao + 1,
        idiomaSalvando: false,
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
        idiomaSalvando: false,
      }));
    }
  },

  atualizarIdioma: (idioma) =>
    definir((atual) => {
      if (atual.estado !== "autenticado" || !atual.usuario) return atual;
      return {
        usuario: { ...atual.usuario, locale: idioma },
        versaoIdioma: atual.versaoIdioma + 1,
        idiomaSalvando: true,
      };
    }),

  finalizarAtualizacaoIdioma: () =>
    definir((atual) => ({
      versaoIdioma: atual.versaoIdioma + 1,
      idiomaSalvando: false,
    })),

  marcarNaoAutenticado: () => {
    limparDadosPrivados();
    definir((atual) => ({
      estado: "naoAutenticado",
      usuario: null,
      geracaoSessao: atual.geracaoSessao + 1,
      idiomaSalvando: false,
    }));
  },
}));

registrarAoExpirarSessao(() =>
  useArmazenamentoAutenticacao.getState().marcarNaoAutenticado(),
);
