import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { router } from "expo-router";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  KeyRound,
  Languages,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  chaveConsultaSessoes,
  ordenarSessoes,
} from "@/features/auth/sessions";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { apiSessoes, apiUsuarios } from "@/lib/api/resources";
import { useListaTreinos } from "@/features/workouts/hooks";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { UserSession } from "@/types/api";

export default function TelaConta() {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const clienteConsulta = useQueryClient();
  const [avisoSessao, definirAvisoSessao] = useState<{
    texto: string;
    erro: boolean;
  } | null>(null);
  const [bio, definirBio] = useState("");
  const [enviandoAvatar, definirEnviandoAvatar] = useState(false);
  const usuario = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario,
  );
  const sair = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.sair,
  );
  const inicializar = useArmazenamentoAutenticacao((estado) => estado.inicializar);
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const consultaTreinos = useListaTreinos(usuario?.id);
  const chaveSessoes = chaveConsultaSessoes(usuario?.id);
  const consultaSessoes = useQuery({
    queryKey: chaveSessoes,
    queryFn: apiSessoes.listar,
    enabled: autenticado,
  });
  const encerrarUmaSessao = useMutation({
    mutationFn: apiSessoes.encerrar,
    onMutate: () => definirAvisoSessao(null),
    onSuccess: async () => {
      definirAvisoSessao({
        texto: traduzir("conta.sessaoEncerrada"),
        erro: false,
      });
      await clienteConsulta.invalidateQueries({ queryKey: chaveSessoes });
    },
    onError: (erro) =>
      definirAvisoSessao({
        texto: obterMensagemErroApi(
          erro,
          traduzir("conta.sessoesErroAcao"),
          false,
        ),
        erro: true,
      }),
  });
  const encerrarOutrasSessoes = useMutation({
    mutationFn: apiSessoes.encerrarOutras,
    onMutate: () => definirAvisoSessao(null),
    onSuccess: async () => {
      definirAvisoSessao({
        texto: traduzir("conta.sessoesEncerradas"),
        erro: false,
      });
      await clienteConsulta.invalidateQueries({ queryKey: chaveSessoes });
    },
    onError: (erro) =>
      definirAvisoSessao({
        texto: obterMensagemErroApi(
          erro,
          traduzir("conta.sessoesErroAcao"),
          false,
        ),
        erro: true,
      }),
  });

  if (!autenticado) {
    return (
      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      >
        <ScrollView contentContainerStyle={styles.conteudo}>
          <ScreenHeader
            inicio={
              <Pressable
                accessibilityLabel={traduzir("autenticacao.voltar")}
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.voltar,
                  { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" },
                ]}
              >
                <ArrowLeft color={tema.cores.texto} size={24} />
              </Pressable>
            }
            titulo={traduzir("navegacao.perfil")}
          />
          <View
            style={[
              styles.visitante,
              {
                backgroundColor: tema.cores.marcaSuave,
                borderColor: tema.cores.marcaContorno,
              },
            ]}
          >
            <View style={[styles.visitanteIcone, { backgroundColor: tema.cores.elevado }]}>
              <UserRound color={tema.cores.marca} size={27} />
            </View>
            <Text style={[styles.nome, { color: tema.cores.texto }]}>
              {traduzir("conta.visitanteTitulo")}
            </Text>
            <Text
              style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}
            >
              {traduzir("conta.visitanteDescricao")}
            </Text>
          </View>
          <AppButton
            onPress={() => router.push("/login")}
            rotulo={traduzir("comum.entrar")}
          />
          <AppButton
            onPress={() => router.push("/register")}
            rotulo={traduzir("comum.criarConta")}
            variante="secondary"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  function confirmarSaida(): void {
    Alert.alert(
      traduzir("conta.confirmarTitulo"),
      traduzir("conta.confirmarDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => {
            void sair().finally(() => {
              clienteConsulta.clear();
              router.replace("/login");
            });
          },
        },
      ],
    );
  }

  function confirmarEncerramento(sessao: UserSession): void {
    const aparelho = sessao.deviceName ?? traduzir("conta.aparelhosTitulo");
    Alert.alert(
      traduzir("conta.encerrarUmaTitulo"),
      traduzir("conta.encerrarUmaDescricao", { aparelho }),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => encerrarUmaSessao.mutate(sessao.id),
        },
      ],
    );
  }

  function confirmarEncerramentoDasOutras(): void {
    Alert.alert(
      traduzir("conta.encerrarOutrasTitulo"),
      traduzir("conta.encerrarOutrasDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => encerrarOutrasSessoes.mutate(),
        },
      ],
    );
  }

  const sessoes = ordenarSessoes(consultaSessoes.data ?? []);
  const possuiOutraSessao = sessoes.some((sessao) => !sessao.current);
  const alterandoSessoes =
    encerrarUmaSessao.isPending || encerrarOutrasSessoes.isPending;

  async function escolherAvatar(): Promise<void> {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.85, exif: false });
    if (resultado.canceled) return;
    definirEnviandoAvatar(true);
    try {
      const imagem = await ImageManipulator.manipulateAsync(resultado.assets[0].uri, [{ resize: { width: 512, height: 512 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
      await apiUsuarios.enviarAvatar(imagem.uri);
      await inicializar();
    } catch { Alert.alert(traduzir("perfil.erroAvatar")); }
    finally { definirEnviandoAvatar(false); }
  }

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      edges={["top", "left", "right", "bottom"]}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader
          inicio={
            <Pressable
              accessibilityLabel={traduzir("autenticacao.voltar")}
              accessibilityRole="button"
              hitSlop={4}
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.voltar,
                { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" },
              ]}
            >
              <ArrowLeft color={tema.cores.texto} size={24} />
            </Pressable>
          }
          titulo={traduzir("navegacao.perfil")}
        />
        <AnimatedEntry>
          <View
            style={[
              styles.perfil,
              { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
            ]}
          >
            <View
              style={[
                styles.perfilVisual,
                {
                  backgroundColor: tema.cores.sobreposicao,
                  borderBottomColor: tema.cores.borda,
                },
              ]}
            >
              <Pressable accessibilityRole="button" accessibilityLabel={traduzir("perfil.trocarFoto")} disabled={enviandoAvatar} onPress={() => void escolherAvatar()} style={({ pressed }) => [
                  styles.avatar,
                  {
                    backgroundColor: tema.cores.marcaSuave,
                    borderColor: tema.cores.marcaContorno,
                  },
              ]}>
                {usuario?.avatarUrl ? (
                  <Image
                    accessibilityLabel={usuario.displayName}
                    contentFit="cover"
                    source={{ uri: usuario.avatarUrl.startsWith("media:") ? `${process.env.EXPO_PUBLIC_API_URL ?? ""}/users/me/avatar` : usuario.avatarUrl }}
                    style={styles.avatarImagem}
                  />
                ) : (
                  <Text style={[styles.inicial, { color: tema.cores.marca }]}>
                    {usuario?.displayName?.trim().charAt(0).toUpperCase() ?? "L"}
                  </Text>
                )}
              </Pressable>
            </View>
            <View style={styles.dadosPerfil}>
              <Text style={[styles.nomePerfil, { color: tema.cores.texto }]}>
                {usuario?.displayName}
              </Text>
              <TextInput accessibilityLabel={traduzir("perfil.bio")} maxLength={500} multiline onChangeText={definirBio} placeholder={traduzir("perfil.bioPlaceholder")} placeholderTextColor={tema.cores.textoSutil} style={[styles.bioInput, { borderColor: tema.cores.borda, color: tema.cores.texto }]} value={bio || usuario?.bio || ""} />
              <AppButton onPress={() => void apiUsuarios.atualizarPerfil({ bio: bio || usuario?.bio || "" }).then(() => inicializar())} rotulo={traduzir("perfil.salvarBio")} variante="secondary" />
              <View style={styles.privacidadePerfil}>
                <View style={styles.textoCartao}>
                  <Text style={[styles.tituloCartao, { color: tema.cores.texto }]}>{traduzir("perfil.publico")}</Text>
                  <Text style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}>{traduzir("perfil.publicoDescricao")}</Text>
                </View>
                <Switch accessibilityLabel={traduzir("perfil.publico")} value={usuario?.profilePublic ?? true} onValueChange={(valor) => void apiUsuarios.atualizarPerfil({ profilePublic: valor }).then(() => inicializar())} trackColor={{ false: tema.cores.borda, true: tema.cores.marcaContorno }} thumbColor={tema.cores.marca} />
              </View>
            </View>
          </View>
        </AnimatedEntry>

        <View style={styles.grupoConta}>
          <View style={styles.tituloLinha}>
            <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>{traduzir("perfil.historico")}</Text>
            <Text style={[styles.contagemTreinos, { color: tema.cores.marca }]}>{consultaTreinos.data?.length ?? 0}</Text>
          </View>
          <View
            style={[styles.historicoPerfil, { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda }]}
          >
            {consultaTreinos.data?.slice(0, 5).map((treino) => <Pressable key={treino.id} onPress={() => router.push({ pathname: "/workouts/[id]", params: { id: treino.id } })} style={styles.linhaTreino}><Text style={[styles.dataTreino, { color: tema.cores.texto }]}>{treino.activityDate}</Text><Text style={[styles.duracaoTreino, { color: tema.cores.textoSecundario }]}>{treino.durationMins} min</Text></Pressable>)}
            {!consultaTreinos.data?.length ? <Text style={[styles.vazioHistorico, { color: tema.cores.textoSecundario }]}>{traduzir("perfil.semHistorico")}</Text> : null}
          </View>
        </View>

        <View style={styles.grupoConta}>
          <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
            {traduzir("conta.preferenciasTitulo")}
          </Text>
          <View
            style={[
              styles.listaConfiguracoes,
              { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
            ]}
          >
            <Text style={[styles.emailConfiguracao, { color: tema.cores.textoSecundario }]}>{usuario?.email}</Text>
            <ConfiguracaoConta
              Icone={Languages}
              descricao={traduzir("conta.idiomaSistema")}
              titulo={traduzir("conta.idiomaTitulo")}
            />
          </View>
        </View>

        <View style={styles.grupoConta}>
          <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
            {traduzir("conta.privacidadeTitulo")}
          </Text>
          <View
            style={[
              styles.listaConfiguracoes,
              { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
            ]}
          >
            <ConfiguracaoConta
              Icone={KeyRound}
              aoPressionar={() => router.push("/change-password")}
              descricao={traduzir("conta.alterarSenhaDescricao")}
              titulo={traduzir("conta.alterarSenha")}
            />
            <View style={[styles.separador, { backgroundColor: tema.cores.borda }]} />
            <ConfiguracaoConta
              Icone={Trash2}
              aoPressionar={() => router.push("/delete-account")}
              descricao={traduzir("conta.excluirContaDescricao")}
              perigosa
              titulo={traduzir("conta.excluirConta")}
            />
          </View>
        </View>

        <View
          style={[
            styles.secaoSessoes,
            { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
          ]}
        >
          <View style={styles.cabecalhoSecao}>
            <View style={[styles.icone, { backgroundColor: tema.cores.marcaSuave }]}>
              <ShieldCheck color={tema.cores.marca} size={21} />
            </View>
            <View style={styles.textoCartao}>
              <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                {traduzir("conta.aparelhosTitulo")}
              </Text>
              <Text style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}>
                {traduzir("conta.aparelhosDescricao")}
              </Text>
            </View>
          </View>

          {consultaSessoes.isPending ? (
            <View
              accessibilityLabel={traduzir("comum.preparando")}
              accessibilityRole="progressbar"
              style={styles.carregandoSessoes}
            >
              <ActivityIndicator color={tema.cores.marca} />
            </View>
          ) : consultaSessoes.isError ? (
            <FeedbackState
              tipo="erro"
              titulo={traduzir("conta.sessoesErroTitulo")}
              descricao={traduzir("conta.sessoesErroDescricao")}
              rotuloAcao={traduzir("comum.tentarNovamente")}
              aoAgir={() => void consultaSessoes.refetch()}
            />
          ) : (
            <View style={styles.listaSessoes}>
              {sessoes.map((sessao) => (
                <SessaoConectada
                  key={sessao.id}
                  sessao={sessao}
                  desabilitada={alterandoSessoes}
                  formatarData={(data) =>
                    new Intl.DateTimeFormat(idioma, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(data))
                  }
                  aoEncerrar={() => confirmarEncerramento(sessao)}
                />
              ))}
              {!possuiOutraSessao ? (
                <Text style={[styles.semOutras, { color: tema.cores.textoSecundario }]}>
                  {traduzir("conta.nenhumaOutraSessao")}
                </Text>
              ) : null}
            </View>
          )}

          {avisoSessao ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.avisoSessao}
            >
              {avisoSessao.erro ? (
                <CircleAlert color={tema.cores.perigo} size={18} />
              ) : (
                <CircleCheck color={tema.cores.sucesso} size={18} />
              )}
              <Text
                style={[
                  styles.mensagemSessao,
                  {
                    color: avisoSessao.erro
                      ? tema.cores.perigo
                      : tema.cores.textoSecundario,
                  },
                ]}
              >
                {avisoSessao.texto}
              </Text>
            </View>
          ) : null}
          {possuiOutraSessao ? (
            <AppButton
              rotulo={traduzir("conta.encerrarOutras")}
              variante="secondary"
              carregando={encerrarOutrasSessoes.isPending}
              disabled={alterandoSessoes}
              onPress={confirmarEncerramentoDasOutras}
            />
          ) : null}
        </View>

        <Pressable
          accessibilityHint={traduzir("conta.confirmarDescricao")}
          accessibilityRole="button"
          onPress={confirmarSaida}
          style={({ pressed }) => [
            styles.sair,
            {
              backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao,
              borderColor: tema.cores.borda,
            },
          ]}
        >
          <LogOut color={tema.cores.textoSecundario} size={20} />
          <View style={styles.sairTextos}>
            <Text style={[styles.sairTitulo, { color: tema.cores.texto }]}>
              {traduzir("conta.sair")}
            </Text>
            <Text style={[styles.sairDescricao, { color: tema.cores.textoSecundario }]}>
              {traduzir("conta.sairDescricao")}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SessaoConectada({
  sessao,
  desabilitada,
  formatarData,
  aoEncerrar,
}: {
  sessao: UserSession;
  desabilitada: boolean;
  formatarData: (data: string) => string;
  aoEncerrar: () => void;
}) {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const Icone = sessao.deviceType === "WEB" ? Monitor : Smartphone;
  const aparelho = sessao.deviceName ?? traduzir("conta.aparelhosTitulo");

  return (
    <View
      style={[
        styles.linhaSessao,
        { backgroundColor: tema.cores.sobreposicao },
      ]}
    >
      <Icone color={tema.cores.textoSecundario} size={21} />
      <View style={styles.dadosSessao}>
        <Text style={[styles.nomeAparelho, { color: tema.cores.texto }]}>
          {aparelho}
        </Text>
        {sessao.current ? (
          <Text style={[styles.atual, { color: tema.cores.sucesso }]}>
            {traduzir("conta.aparelhoAtual")}
          </Text>
        ) : null}
        <Text style={[styles.atividadeSessao, { color: tema.cores.textoSecundario }]}>
          {traduzir("conta.ultimaAtividade", {
            data: formatarData(sessao.lastUsedAt),
          })}
        </Text>
      </View>
      {!sessao.current ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={traduzir("conta.encerrarAparelho", { aparelho })}
          accessibilityState={{ disabled: desabilitada }}
          disabled={desabilitada}
          hitSlop={8}
          onPress={aoEncerrar}
          style={({ pressed }) => [
            styles.encerrarSessao,
            {
              backgroundColor: pressed
                ? tema.cores.perigoSuave
                : "transparent",
              opacity: desabilitada ? 0.45 : 1,
            },
          ]}
        >
          <X color={tema.cores.perigo} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ConfiguracaoConta({
  Icone,
  titulo,
  descricao,
  aoPressionar,
  perigosa = false,
}: {
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
  aoPressionar?: () => void;
  perigosa?: boolean;
}) {
  const tema = useTemaApp();
  const cor = perigosa ? tema.cores.perigo : tema.cores.marca;

  return (
    <Pressable
      accessibilityRole={aoPressionar ? "button" : "text"}
      onPress={aoPressionar}
      disabled={!aoPressionar}
      style={({ pressed }) => [
        styles.configuracao,
        { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" },
      ]}
    >
      <View
        style={[
          styles.icone,
          { backgroundColor: perigosa ? tema.cores.perigoSuave : tema.cores.marcaSuave },
        ]}
      >
        <Icone color={cor} size={21} />
      </View>
      <View style={styles.textoCartao}>
        <Text style={[styles.tituloCartao, { color: perigosa ? tema.cores.perigo : tema.cores.texto }]}>
          {titulo}
        </Text>
        <Text
          style={[
            styles.descricaoCartao,
            { color: tema.cores.textoSecundario },
          ]}
        >
          {descricao}
        </Text>
      </View>
      {aoPressionar ? <ChevronRight color={tema.cores.textoSutil} size={20} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  voltar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  perfil: {
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 220,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  perfilVisual: {
    alignItems: "center",
    borderBottomWidth: 1,
    justifyContent: "center",
    minHeight: 126,
    overflow: "hidden",
  },
  visitante: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  visitanteIcone: { alignItems: "center", borderRadius: 25, height: 50, justifyContent: "center", width: 50 },
  avatar: {
    alignItems: "center",
    borderRadius: 44,
    borderWidth: 2,
    height: 88,
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: 88,
    zIndex: 1,
  },
  avatarImagem: { borderRadius: 40, height: 80, width: 80 },
  inicial: { fontSize: 30, fontWeight: "900" },
  dadosPerfil: { alignItems: "center", gap: 5, padding: 20 },
  privacidadePerfil: { alignItems: "center", flexDirection: "row", gap: 12, paddingTop: 8, width: "100%" },
  nome: { fontSize: 17, fontWeight: "700" },
  nomePerfil: { fontSize: 22, fontWeight: "900", lineHeight: 28, textAlign: "center" },
  emailConfiguracao: { fontSize: 14, padding: 16 },
  bioInput: { borderRadius: 12, borderWidth: 1, fontSize: 14, minHeight: 64, padding: 10, textAlignVertical: "top", width: "100%" },
  tituloLinha: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  contagemTreinos: { fontSize: 16, fontWeight: "800" },
  historicoPerfil: { borderRadius: 20, borderWidth: 1, gap: 2, overflow: "hidden", padding: 8 },
  linhaTreino: { alignItems: "center", borderRadius: 12, flexDirection: "row", justifyContent: "space-between", minHeight: 48, paddingHorizontal: 12 },
  dataTreino: { fontSize: 14, fontWeight: "700" },
  duracaoTreino: { fontSize: 13 },
  vazioHistorico: { fontSize: 14, padding: 12 },
  planoPill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, position: "absolute", right: 16, top: 16, zIndex: 2 },
  plano: { fontSize: 11, fontWeight: "800" },
  icone: {
    alignItems: "center",
    borderRadius: 11,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  textoCartao: { flex: 1, gap: 4 },
  tituloCartao: { fontSize: 15, fontWeight: "700" },
  descricaoCartao: { fontSize: 13, lineHeight: 19 },
  secaoSessoes: {
    borderRadius: 22,
    borderWidth: 1,
    elevation: 1,
    gap: 15,
    padding: 18,
    shadowColor: "#2B1712",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cabecalhoSecao: { alignItems: "flex-start", flexDirection: "row", gap: 13 },
  tituloSecao: { fontSize: 18, fontWeight: "700" },
  carregandoSessoes: { alignItems: "center", minHeight: 72, justifyContent: "center" },
  listaSessoes: { gap: 8 },
  linhaSessao: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 12, minHeight: 76, padding: 12 },
  dadosSessao: { flex: 1, gap: 2 },
  nomeAparelho: { fontSize: 15, fontWeight: "700" },
  atual: { fontSize: 13, fontWeight: "700" },
  atividadeSessao: { fontSize: 13, lineHeight: 18 },
  encerrarSessao: { alignItems: "center", borderRadius: 12, height: 44, justifyContent: "center", width: 44 },
  semOutras: { fontSize: 13, lineHeight: 19, paddingVertical: 13 },
  avisoSessao: { alignItems: "center", flexDirection: "row", gap: 8 },
  mensagemSessao: { flex: 1, fontSize: 13, lineHeight: 19 },
  grupoConta: { gap: 10 },
  listaConfiguracoes: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  configuracao: { alignItems: "center", flexDirection: "row", gap: 13, minHeight: 78, padding: 14 },
  separador: { height: StyleSheet.hairlineWidth, marginLeft: 69 },
  sair: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 13, minHeight: 72, padding: 15 },
  sairTextos: { flex: 1, gap: 3 },
  sairTitulo: { fontSize: 15, fontWeight: "700" },
  sairDescricao: { fontSize: 13, lineHeight: 18 },
});
