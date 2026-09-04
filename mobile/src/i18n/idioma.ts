import { useLocales } from "expo-localization";
import { useCallback } from "react";

const portuguesBrasil = {
  "comum.preparando": "Preparando seu Lumina…",
  "comum.tentarNovamente": "Tentar novamente",
  "comum.erroPadrao": "Não foi possível concluir a ação. Tente novamente.",
  "autenticacao.voltar": "Voltar",
  "autenticacao.email": "E-mail",
  "autenticacao.emailPlaceholder": "voce@exemplo.com",
  "autenticacao.senha": "Senha",
  "autenticacao.mostrarSenha": "Mostrar senha",
  "autenticacao.ocultarSenha": "Ocultar senha",
  "validacao.email": "Informe um e-mail válido.",
  "validacao.senhaObrigatoria": "Informe sua senha.",
  "validacao.nomeMinimo": "Use pelo menos 2 caracteres.",
  "validacao.nomeMaximo": "Use no máximo 100 caracteres.",
  "validacao.usuarioMinimo": "Use pelo menos 3 caracteres.",
  "validacao.usuarioMaximo": "Use no máximo 50 caracteres.",
  "validacao.usuarioFormato": "Use apenas letras minúsculas, números e _.",
  "validacao.senhaMinimo": "Use pelo menos 8 caracteres.",
  "validacao.senhaMaximo": "Use no máximo 128 caracteres.",
  "validacao.senhasDiferentes": "As senhas não coincidem.",
  "login.destaque": "Bem-vindo de volta",
  "login.titulo": "Entre na sua conta",
  "login.descricao":
    "Continue de onde parou e mantenha seu progresso em movimento.",
  "login.acao": "Entrar",
  "login.semConta": "Ainda não tem uma conta?",
  "login.criarConta": "Criar conta",
  "login.erro":
    "Não foi possível entrar. Verifique seus dados e tente novamente.",
  "cadastro.destaque": "Comece com clareza",
  "cadastro.titulo": "Crie sua conta",
  "cadastro.descricao": "Organize tarefas, hábitos e metas em um só lugar.",
  "cadastro.nome": "Nome",
  "cadastro.nomePlaceholder": "Como você quer ser chamado?",
  "cadastro.usuario": "Nome de usuário",
  "cadastro.usuarioPlaceholder": "seu_usuario",
  "cadastro.confirmarSenha": "Confirmar senha",
  "cadastro.acao": "Criar conta",
  "cadastro.comConta": "Já tem uma conta?",
  "cadastro.entrar": "Entrar",
  "cadastro.erro":
    "Não foi possível criar sua conta. Revise os dados e tente novamente.",
  "navegacao.inicio": "Início",
  "navegacao.tarefas": "Tarefas",
  "navegacao.conta": "Conta",
  "inicio.bomDia": "Bom dia",
  "inicio.boaTarde": "Boa tarde",
  "inicio.boaNoite": "Boa noite",
  "inicio.subtitulo": "Este é seu ritmo de hoje.",
  "inicio.tarefasHoje": "Tarefas hoje",
  "inicio.sequencia": "Sequência",
  "inicio.focoSemana": "Foco na semana",
  "inicio.metasAtivas": "Metas ativas",
  "inicio.minutos": "{quantidade} min",
  "inicio.dias": "{quantidade} d",
  "inicio.tarefasTitulo": "Tarefas de hoje",
  "inicio.tarefasVazias": "Nenhuma tarefa agendada para hoje.",
  "inicio.erroTitulo": "Resumo indisponível",
  "inicio.erroDescricao": "Confira sua conexão e tente carregar novamente.",
  "tarefas.titulo": "Tarefas",
  "tarefas.resumo": "{pendentes} pendentes · {concluidas} concluídas",
  "tarefas.novaPlaceholder": "Nova tarefa…",
  "tarefas.criar": "Criar",
  "tarefas.concluidas": "Concluídas",
  "tarefas.vazioTitulo": "Nenhuma tarefa",
  "tarefas.vazioDescricao": "Crie sua primeira tarefa acima.",
  "tarefas.erroTitulo": "Tarefas indisponíveis",
  "tarefas.erroDescricao": "Não foi possível carregar suas tarefas.",
  "tarefas.erroCriar": "Não foi possível criar a tarefa.",
  "tarefas.erroAlternar": "Não foi possível atualizar a tarefa.",
  "tarefas.concluir": "Marcar {titulo} como concluída",
  "tarefas.reabrir": "Marcar {titulo} como pendente",
  "conta.titulo": "Conta",
  "conta.plano": "Plano {plano}",
  "conta.sessaoTitulo": "Sessão protegida",
  "conta.sessaoDescricao":
    "Sua credencial é guardada pelo Keychain ou Keystore deste aparelho.",
  "conta.idiomaTitulo": "Idioma",
  "conta.idiomaSistema":
    "O Lumina acompanha o idioma do aparelho: Português (Brasil) ou English.",
  "conta.sair": "Sair da conta",
  "conta.confirmarTitulo": "Sair da conta?",
  "conta.confirmarDescricao":
    "Você precisará informar seus dados para entrar novamente.",
  "conta.cancelar": "Cancelar",
  "conta.confirmar": "Sair",
} as const;

type ChaveTraducao = keyof typeof portuguesBrasil;

const ingles: Record<ChaveTraducao, string> = {
  "comum.preparando": "Preparing your Lumina…",
  "comum.tentarNovamente": "Try again",
  "comum.erroPadrao": "We could not complete this action. Try again.",
  "autenticacao.voltar": "Back",
  "autenticacao.email": "Email",
  "autenticacao.emailPlaceholder": "you@example.com",
  "autenticacao.senha": "Password",
  "autenticacao.mostrarSenha": "Show password",
  "autenticacao.ocultarSenha": "Hide password",
  "validacao.email": "Enter a valid email address.",
  "validacao.senhaObrigatoria": "Enter your password.",
  "validacao.nomeMinimo": "Use at least 2 characters.",
  "validacao.nomeMaximo": "Use at most 100 characters.",
  "validacao.usuarioMinimo": "Use at least 3 characters.",
  "validacao.usuarioMaximo": "Use at most 50 characters.",
  "validacao.usuarioFormato": "Use lowercase letters, numbers, and _ only.",
  "validacao.senhaMinimo": "Use at least 8 characters.",
  "validacao.senhaMaximo": "Use at most 128 characters.",
  "validacao.senhasDiferentes": "Passwords do not match.",
  "login.destaque": "Welcome back",
  "login.titulo": "Sign in to your account",
  "login.descricao":
    "Pick up where you left off and keep your progress moving.",
  "login.acao": "Sign in",
  "login.semConta": "Do not have an account yet?",
  "login.criarConta": "Create account",
  "login.erro": "Could not sign in. Check your details and try again.",
  "cadastro.destaque": "Start with clarity",
  "cadastro.titulo": "Create your account",
  "cadastro.descricao": "Organize tasks, habits, and goals in one place.",
  "cadastro.nome": "Name",
  "cadastro.nomePlaceholder": "What should we call you?",
  "cadastro.usuario": "Username",
  "cadastro.usuarioPlaceholder": "your_username",
  "cadastro.confirmarSenha": "Confirm password",
  "cadastro.acao": "Create account",
  "cadastro.comConta": "Already have an account?",
  "cadastro.entrar": "Sign in",
  "cadastro.erro":
    "Could not create your account. Review your details and try again.",
  "navegacao.inicio": "Home",
  "navegacao.tarefas": "Tasks",
  "navegacao.conta": "Account",
  "inicio.bomDia": "Good morning",
  "inicio.boaTarde": "Good afternoon",
  "inicio.boaNoite": "Good evening",
  "inicio.subtitulo": "Here is your pace today.",
  "inicio.tarefasHoje": "Tasks today",
  "inicio.sequencia": "Streak",
  "inicio.focoSemana": "Focus this week",
  "inicio.metasAtivas": "Active goals",
  "inicio.minutos": "{quantidade} min",
  "inicio.dias": "{quantidade} d",
  "inicio.tarefasTitulo": "Today's tasks",
  "inicio.tarefasVazias": "No tasks scheduled for today.",
  "inicio.erroTitulo": "Summary unavailable",
  "inicio.erroDescricao": "Check your connection and try loading again.",
  "tarefas.titulo": "Tasks",
  "tarefas.resumo": "{pendentes} pending · {concluidas} completed",
  "tarefas.novaPlaceholder": "New task…",
  "tarefas.criar": "Create",
  "tarefas.concluidas": "Completed",
  "tarefas.vazioTitulo": "No tasks",
  "tarefas.vazioDescricao": "Create your first task above.",
  "tarefas.erroTitulo": "Tasks unavailable",
  "tarefas.erroDescricao": "Could not load your tasks.",
  "tarefas.erroCriar": "Could not create the task.",
  "tarefas.erroAlternar": "Could not update the task.",
  "tarefas.concluir": "Mark {titulo} as completed",
  "tarefas.reabrir": "Mark {titulo} as pending",
  "conta.titulo": "Account",
  "conta.plano": "{plano} plan",
  "conta.sessaoTitulo": "Protected session",
  "conta.sessaoDescricao":
    "Your credential is stored in this device's Keychain or Keystore.",
  "conta.idiomaTitulo": "Language",
  "conta.idiomaSistema":
    "Lumina follows your device language: Português (Brasil) or English.",
  "conta.sair": "Sign out",
  "conta.confirmarTitulo": "Sign out?",
  "conta.confirmarDescricao":
    "You will need your credentials to sign in again.",
  "conta.cancelar": "Cancel",
  "conta.confirmar": "Sign out",
};

type VariaveisTraducao = Record<string, string | number>;

export function useIdioma() {
  const locais = useLocales();
  const idioma = locais[0]?.languageCode === "en" ? "en" : "pt-BR";
  const dicionario = idioma === "en" ? ingles : portuguesBrasil;

  const traduzir = useCallback(
    (chave: ChaveTraducao, variaveis?: VariaveisTraducao) => {
      let texto: string = dicionario[chave];
      for (const [nome, valor] of Object.entries(variaveis ?? {})) {
        texto = texto.replaceAll(`{${nome}}`, String(valor));
      }
      return texto;
    },
    [dicionario],
  );

  return { idioma, traduzir } as const;
}
