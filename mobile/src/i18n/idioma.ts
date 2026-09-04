import { useLocales } from "expo-localization";
import { useCallback } from "react";

const portuguesBrasil = {
  "comum.preparando": "Preparando seu Lumina…",
  "comum.tentarNovamente": "Tentar novamente",
  "comum.erroPadrao": "Não foi possível concluir a ação. Tente novamente.",
  "comum.entrar": "Entrar",
  "comum.criarConta": "Criar conta",
  "comum.offline": "Sem conexão. Alterações serão enviadas quando a internet voltar.",
  "comum.notificacoes": "Notificações",
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
  "login.erroCredenciais": "E-mail ou senha incorretos.",
  "login.erroConexao":
    "Não foi possível conectar ao Lumina. Verifique sua internet e tente novamente.",
  "login.erroTimeout": "A conexão demorou mais que o esperado.",
  "login.erroIndisponivel":
    "O Lumina está temporariamente indisponível. Tente novamente em instantes.",
  "login.erroConfiguracao":
    "O aplicativo ainda não foi configurado para conectar ao Lumina.",
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
  "navegacao.treinos": "Treinos",
  "navegacao.amigos": "Amigos",
  "navegacao.conta": "Conta",
  "inicio.bomDia": "Bom dia",
  "inicio.boaTarde": "Boa tarde",
  "inicio.boaNoite": "Boa noite",
  "inicio.subtitulo": "Este é seu ritmo de hoje.",
  "inicio.visitanteSaudacao": "Olá",
  "inicio.visitanteSubtitulo": "Explore no seu ritmo. Entre apenas quando quiser salvar.",
  "inicio.hoje": "Hoje",
  "inicio.visitanteTitulo": "Conheça o Lumina antes de criar sua conta.",
  "inicio.visitanteDescricao":
    "Veja como tarefas, treinos e apoio entre amigos cabem na sua rotina. Nenhum dado fictício será exibido.",
  "inicio.acaoExplorar": "Explorar treinos",
  "inicio.acaoTarefa": "Ver tarefa",
  "inicio.acaoTreino": "Registrar atividade",
  "inicio.pendenteTitulo": "Seu próximo passo está claro.",
  "inicio.pendenteDescricao": "Continue: {titulo}",
  "inicio.semRegistroTitulo": "Pronto para registrar seu dia?",
  "inicio.semRegistroDescricao":
    "Uma atividade curta já conta. Você escolhe o ritmo.",
  "inicio.progressoTitulo": "Sua semana",
  "inicio.diasAtivos": "{quantidade} de 7 dias com registros.",
  "inicio.resumoSemana":
    "{tarefas} tarefas concluídas · {minutos} min de foco",
  "inicio.semanaVazia": "Nenhum registro nesta semana. Comece quando fizer sentido.",
  "inicio.constanciaTitulo": "Constância sem culpa",
  "inicio.retomada": "Uma pausa não apaga seu caminho.",
  "inicio.primeiroPasso": "Seu primeiro registro pode ser pequeno e ainda assim valer.",
  "inicio.amigosTitulo": "Amigos em movimento",
  "inicio.amigosVazio":
    "Adicione amigos para acompanhar conquistas compartilhadas por escolha.",
  "inicio.verAmigos": "Ver amigos",
  "inicio.proximoTitulo": "Próximo passo",
  "inicio.proximoTarefa": "Você tem uma tarefa pendente para hoje.",
  "inicio.proximoLivre": "Seu dia está livre. Você pode registrar uma atividade quando quiser.",
  "inicio.proximoExplicacao": "Sugestão baseada apenas nos seus registros de hoje.",
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
  "tarefas.visitanteTitulo": "Explore tarefas sem compromisso",
  "tarefas.visitanteDescricao":
    "Entre quando quiser criar, editar e sincronizar suas tarefas com segurança.",
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
  "conta.visitanteTitulo": "Você está explorando sem conta",
  "conta.visitanteDescricao":
    "Crie uma conta somente quando quiser salvar e sincronizar seus registros.",
  "treinos.titulo": "Treinos",
  "treinos.vazioTitulo": "Nenhum treino registrado",
  "treinos.vazioDescricao":
    "Registre modalidade, data e duração quando estiver pronto.",
  "treinos.visitanteDescricao":
    "Explore modalidades agora. Para salvar um treino, entre ou crie uma conta.",
  "treinos.modalidadePassos": "Caminhada e corrida",
  "treinos.modalidadeForca": "Musculação e mobilidade",
  "treinos.modalidadeEsportes": "Ciclismo e esportes coletivos",
  "treinos.modalidadeOutras": "Natação e atividades personalizadas",
  "amigos.titulo": "Amigos",
  "amigos.vazioTitulo": "Sua rede começa com pessoas próximas",
  "amigos.vazioDescricao":
    "Adicione amigos para acompanhar somente o que eles escolherem compartilhar.",
  "amigos.visitanteDescricao":
    "Conheça a rede privada. Busca e interações exigem uma conta.",
  "amigos.privacidade":
    "Privacidade padrão: Somente eu. Compartilhar sempre será opcional.",
} as const;

type ChaveTraducao = keyof typeof portuguesBrasil;

const ingles: Record<ChaveTraducao, string> = {
  "comum.preparando": "Preparing your Lumina…",
  "comum.tentarNovamente": "Try again",
  "comum.erroPadrao": "We could not complete this action. Try again.",
  "comum.entrar": "Sign in",
  "comum.criarConta": "Create account",
  "comum.offline": "Offline. Changes will be sent when your connection returns.",
  "comum.notificacoes": "Notifications",
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
  "login.erroCredenciais": "Incorrect email or password.",
  "login.erroConexao":
    "Could not connect to Lumina. Check your internet connection and try again.",
  "login.erroTimeout": "The connection took longer than expected.",
  "login.erroIndisponivel":
    "Lumina is temporarily unavailable. Try again in a moment.",
  "login.erroConfiguracao":
    "The app has not been configured to connect to Lumina yet.",
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
  "navegacao.treinos": "Workouts",
  "navegacao.amigos": "Friends",
  "navegacao.conta": "Account",
  "inicio.bomDia": "Good morning",
  "inicio.boaTarde": "Good afternoon",
  "inicio.boaNoite": "Good evening",
  "inicio.subtitulo": "Here is your pace today.",
  "inicio.visitanteSaudacao": "Hello",
  "inicio.visitanteSubtitulo": "Explore at your pace. Sign in only when you want to save.",
  "inicio.hoje": "Today",
  "inicio.visitanteTitulo": "Get to know Lumina before creating an account.",
  "inicio.visitanteDescricao":
    "See how tasks, workouts, and support from friends can fit your routine. No fictional data will be shown.",
  "inicio.acaoExplorar": "Explore workouts",
  "inicio.acaoTarefa": "View task",
  "inicio.acaoTreino": "Log activity",
  "inicio.pendenteTitulo": "Your next step is clear.",
  "inicio.pendenteDescricao": "Continue: {titulo}",
  "inicio.semRegistroTitulo": "Ready to record your day?",
  "inicio.semRegistroDescricao":
    "A short activity still counts. You set the pace.",
  "inicio.progressoTitulo": "Your week",
  "inicio.diasAtivos": "Records on {quantidade} of 7 days.",
  "inicio.resumoSemana":
    "{tarefas} tasks completed · {minutos} focus min",
  "inicio.semanaVazia": "No records this week. Start when it feels right.",
  "inicio.constanciaTitulo": "Consistency without guilt",
  "inicio.retomada": "A pause does not erase your progress.",
  "inicio.primeiroPasso": "Your first record can be small and still matter.",
  "inicio.amigosTitulo": "Friends in motion",
  "inicio.amigosVazio":
    "Add friends to follow achievements they choose to share.",
  "inicio.verAmigos": "View friends",
  "inicio.proximoTitulo": "Next step",
  "inicio.proximoTarefa": "You have a pending task for today.",
  "inicio.proximoLivre": "Your day is clear. You can log an activity whenever you want.",
  "inicio.proximoExplicacao": "Suggested only from today's records.",
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
  "tarefas.visitanteTitulo": "Explore tasks with no commitment",
  "tarefas.visitanteDescricao":
    "Sign in when you want to create, edit, and securely sync your tasks.",
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
  "conta.visitanteTitulo": "You are exploring without an account",
  "conta.visitanteDescricao":
    "Create an account only when you want to save and sync your records.",
  "treinos.titulo": "Workouts",
  "treinos.vazioTitulo": "No workouts recorded",
  "treinos.vazioDescricao":
    "Record activity, date, and duration when you are ready.",
  "treinos.visitanteDescricao":
    "Explore activities now. Sign in or create an account when you want to save a workout.",
  "treinos.modalidadePassos": "Walking and running",
  "treinos.modalidadeForca": "Strength training and mobility",
  "treinos.modalidadeEsportes": "Cycling and team sports",
  "treinos.modalidadeOutras": "Swimming and custom activities",
  "amigos.titulo": "Friends",
  "amigos.vazioTitulo": "Your circle starts with people close to you",
  "amigos.vazioDescricao":
    "Add friends to follow only what they choose to share.",
  "amigos.visitanteDescricao":
    "Explore the private network. Search and interactions require an account.",
  "amigos.privacidade":
    "Default privacy: Only me. Sharing will always be optional.",
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
