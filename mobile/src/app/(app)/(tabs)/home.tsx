import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  UsersRound,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LuminaMark } from "@/components/brand/lumina-mark";
import { WeeklyArc } from "@/components/progress/weekly-arc";
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { resumirSemana } from "@/features/dashboard/home-metrics";
import { chavesTarefasUsuario } from "@/features/tasks/task-query-keys";
import { useIdioma } from "@/i18n/idioma";
import { apiPainel } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

function obterSaudacao(
  traduzir: ReturnType<typeof useIdioma>["traduzir"],
): string {
  const hora = new Date().getHours();
  if (hora < 12) return traduzir("inicio.bomDia");
  if (hora < 18) return traduzir("inicio.boaTarde");
  return traduzir("inicio.boaNoite");
}

export default function TelaInicio() {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const estadoAutenticacao = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );
  const usuario = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario,
  );
  const autenticado = estadoAutenticacao === "autenticado";
  const userId = usuario?.id;
  const consulta = useQuery({
    queryKey: chavesTarefasUsuario(userId).painel,
    queryFn: apiPainel.obter,
    enabled: Boolean(userId),
  });
  const primeiroNome = usuario?.displayName?.trim().split(" ")[0];
  const data = new Intl.DateTimeFormat(idioma, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const tarefasHoje = consulta.data?.todayTasks ?? [];
  const tarefaPendente = tarefasHoje.find((tarefa) => tarefa.status !== "DONE");
  const resumo = resumirSemana(consulta.data?.weeklyData ?? []);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          autenticado ? (
            <RefreshControl
              onRefresh={() => void consulta.refetch()}
              refreshing={consulta.isRefetching}
              tintColor={tema.cores.marca}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecalho}>
          <View style={styles.identidade}>
            {usuario?.avatarUrl ? (
              <Image
                accessibilityLabel={usuario.displayName}
                contentFit="cover"
                source={{ uri: usuario.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: tema.cores.marcaSuave },
                ]}
              >
                {autenticado ? (
                  <Text style={[styles.inicial, { color: tema.cores.marca }]}>
                    {primeiroNome?.charAt(0).toUpperCase() ?? "L"}
                  </Text>
                ) : (
                  <LuminaMark decorativo tamanho={42} />
                )}
              </View>
            )}
            <View style={styles.cabecalhoTexto}>
              <Text
                accessibilityRole="header"
                style={[styles.saudacao, { color: tema.cores.texto }]}
              >
                {autenticado
                  ? `${obterSaudacao(traduzir)}${
                      primeiroNome ? `, ${primeiroNome}` : ""
                    }`
                  : traduzir("inicio.visitanteSaudacao")}
              </Text>
              <Text style={[styles.data, { color: tema.cores.textoSecundario }]}>
                {data}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel={traduzir("comum.notificacoes")}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            disabled
            style={[
              styles.botaoIcone,
              {
                backgroundColor: tema.cores.elevado,
                borderColor: tema.cores.borda,
              },
            ]}
          >
            <Bell color={tema.cores.textoSutil} size={20} />
          </Pressable>
        </View>

        <AnimatedEntry>
          <View style={[styles.hero, { backgroundColor: tema.cores.marca }]}>
            <View
              pointerEvents="none"
              style={[
                styles.orbeMaior,
                { backgroundColor: tema.cores.sobreMarca },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.orbeMenor,
                { backgroundColor: tema.cores.sobreMarca },
              ]}
            />
            <Text style={[styles.sobretitulo, { color: tema.cores.sobreMarca }]}>
              {traduzir("inicio.hoje")}
            </Text>
            {consulta.isLoading && autenticado ? (
              <ActivityIndicator
                color={tema.cores.sobreMarca}
                style={styles.carga}
              />
            ) : consulta.isError && autenticado ? (
              <View
                style={[
                  styles.estadoHero,
                  { backgroundColor: tema.cores.elevado },
                ]}
              >
                <FeedbackState
                  aoAgir={() => void consulta.refetch()}
                  descricao={traduzir("inicio.erroDescricao")}
                  rotuloAcao={traduzir("comum.tentarNovamente")}
                  tipo="erro"
                  titulo={traduzir("inicio.erroTitulo")}
                />
              </View>
            ) : (
              <>
                <Text
                  style={[styles.tituloHero, { color: tema.cores.sobreMarca }]}
                >
                  {!autenticado
                    ? traduzir("inicio.visitanteTitulo")
                    : tarefaPendente
                      ? traduzir("inicio.pendenteTitulo")
                      : traduzir("inicio.semRegistroTitulo")}
                </Text>
                <Text
                  style={[
                    styles.descricaoHero,
                    { color: tema.cores.sobreMarca },
                  ]}
                >
                  {!autenticado
                    ? traduzir("inicio.visitanteDescricao")
                    : tarefaPendente
                      ? traduzir("inicio.pendenteDescricao", {
                          titulo: tarefaPendente.title,
                        })
                      : traduzir("inicio.semRegistroDescricao")}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(tarefaPendente ? "/tasks" : "/workouts")
                  }
                  style={({ pressed }) => [
                    styles.acaoHero,
                    {
                      backgroundColor: tema.cores.sobreMarca,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.acaoHeroTexto, { color: tema.cores.marca }]}
                  >
                    {!autenticado
                      ? traduzir("inicio.acaoExplorar")
                      : tarefaPendente
                        ? traduzir("inicio.acaoTarefa")
                        : traduzir("inicio.acaoTreino")}
                  </Text>
                  <ArrowUpRight color={tema.cores.marca} size={18} />
                </Pressable>
                {!autenticado ? (
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={10}
                    onPress={() => router.push("/login")}
                    style={styles.linkEntrar}
                  >
                    <Text
                      style={[
                        styles.linkEntrarTexto,
                        { color: tema.cores.sobreMarca },
                      ]}
                    >
                      {traduzir("comum.entrar")}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </AnimatedEntry>

        {autenticado && consulta.data ? (
          <AnimatedEntry>
            <View style={styles.blocoSemana}>
              <View style={styles.tituloLinha}>
                <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                  {traduzir("inicio.progressoTitulo")}
                </Text>
                <View
                  style={[
                    styles.selo,
                    { backgroundColor: tema.cores.marcaSuave },
                  ]}
                >
                  <Text style={[styles.seloTexto, { color: tema.cores.marca }]}>
                    {traduzir("inicio.diasAtivos", {
                      quantidade: resumo.diasAtivos,
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.bentoLinha}>
                <View
                  style={[
                    styles.cardProgresso,
                    {
                      backgroundColor: tema.cores.elevado,
                      borderColor: tema.cores.borda,
                    },
                  ]}
                >
                  <View style={styles.arco}>
                    <WeeklyArc
                      progresso={resumo.diasAtivos / 7}
                      rotulo={traduzir("inicio.diasAtivos", {
                        quantidade: resumo.diasAtivos,
                      })}
                      tamanho={106}
                    />
                    <View
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={styles.arcoCentro}
                    >
                      <Text
                        style={[styles.arcoNumero, { color: tema.cores.texto }]}
                      >
                        {resumo.diasAtivos}
                      </Text>
                      <Text
                        style={[
                          styles.arcoTotal,
                          { color: tema.cores.textoSutil },
                        ]}
                      >
                        / 7
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.cardTitulo, { color: tema.cores.texto }]}>
                    {traduzir("inicio.constanciaTitulo")}
                  </Text>
                  <Text
                    style={[
                      styles.cardApoio,
                      { color: tema.cores.textoSecundario },
                    ]}
                  >
                    {resumo.diasAtivos
                      ? traduzir("inicio.retomada")
                      : traduzir("inicio.primeiroPasso")}
                  </Text>
                </View>

                <View style={styles.metricasColuna}>
                  <View
                    style={[
                      styles.cardMetrica,
                      { backgroundColor: tema.cores.sucessoSuave },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconeMetrica,
                        { backgroundColor: tema.cores.elevado },
                      ]}
                    >
                      <CheckCircle2 color={tema.cores.sucesso} size={18} />
                    </View>
                    <Text
                      style={[styles.numeroMetrica, { color: tema.cores.texto }]}
                    >
                      {resumo.tarefasConcluidas}
                    </Text>
                    <Text
                      style={[
                        styles.rotuloMetrica,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.tarefasConcluidasSemana")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.cardMetrica,
                      { backgroundColor: tema.cores.informacaoSuave },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconeMetrica,
                        { backgroundColor: tema.cores.elevado },
                      ]}
                    >
                      <Clock3 color={tema.cores.informacao} size={18} />
                    </View>
                    <Text
                      style={[styles.numeroMetrica, { color: tema.cores.texto }]}
                    >
                      {resumo.minutosFoco}
                    </Text>
                    <Text
                      style={[
                        styles.rotuloMetrica,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.focoSemana")}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </AnimatedEntry>
        ) : null}

        <AnimatedEntry>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/friends")}
            style={({ pressed }) => [
              styles.social,
              {
                backgroundColor: pressed
                  ? tema.cores.marcaSuave
                  : tema.cores.elevado,
                borderColor: tema.cores.borda,
              },
            ]}
          >
            <View
              style={[
                styles.socialIcone,
                { backgroundColor: tema.cores.marcaSuave },
              ]}
            >
              <UsersRound color={tema.cores.marca} size={24} />
            </View>
            <View style={styles.socialTexto}>
              <Text style={[styles.cardTitulo, { color: tema.cores.texto }]}>
                {traduzir("inicio.amigosTitulo")}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.cardApoio,
                  { color: tema.cores.textoSecundario },
                ]}
              >
                {traduzir("inicio.amigosVazio")}
              </Text>
              <Text style={[styles.socialLink, { color: tema.cores.marca }]}>
                {traduzir("inicio.verAmigos")}
              </Text>
            </View>
            <ChevronRight color={tema.cores.textoSutil} size={20} />
          </Pressable>
        </AnimatedEntry>

        {autenticado && consulta.data ? (
          <View
            style={[
              styles.notaEtica,
              { backgroundColor: tema.cores.alertaSuave },
            ]}
          >
            <Flame color={tema.cores.alerta} size={18} />
            <Text
              style={[
                styles.notaEticaTexto,
                { color: tema.cores.textoSecundario },
              ]}
            >
              {traduzir("inicio.proximoExplicacao")}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 24,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  identidade: { alignItems: "center", flex: 1, flexDirection: "row", gap: 12 },
  cabecalhoTexto: { flex: 1, gap: 2 },
  avatar: { borderRadius: 23, height: 46, width: 46 },
  avatarFallback: {
    alignItems: "center",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  inicial: { fontSize: 19, fontWeight: "800" },
  saudacao: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  data: { fontSize: 13, textTransform: "capitalize" },
  botaoIcone: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  hero: {
    borderRadius: 28,
    minHeight: 284,
    overflow: "hidden",
    padding: 24,
  },
  orbeMaior: {
    borderRadius: 90,
    height: 180,
    opacity: 0.08,
    position: "absolute",
    right: -64,
    top: -72,
    width: 180,
  },
  orbeMenor: {
    borderRadius: 50,
    bottom: -44,
    height: 100,
    left: -30,
    opacity: 0.06,
    position: "absolute",
    width: 100,
  },
  sobretitulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 16,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  tituloHero: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
    maxWidth: 300,
  },
  descricaoHero: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 310,
    opacity: 0.82,
  },
  carga: { marginVertical: 70 },
  estadoHero: { borderRadius: 18, padding: 16 },
  acaoHero: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 18,
  },
  acaoHeroTexto: { fontSize: 15, fontWeight: "800" },
  linkEntrar: { alignSelf: "flex-start", minHeight: 44, paddingVertical: 12 },
  linkEntrarTexto: { fontSize: 14, fontWeight: "700", opacity: 0.9 },
  blocoSemana: { gap: 14 },
  tituloLinha: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  tituloSecao: { fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  selo: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  seloTexto: { fontSize: 11, fontWeight: "800" },
  bentoLinha: { flexDirection: "row", gap: 12 },
  cardProgresso: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1.25,
    minHeight: 260,
    padding: 18,
  },
  arco: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  arcoCentro: {
    alignItems: "baseline",
    flexDirection: "row",
    position: "absolute",
  },
  arcoNumero: { fontSize: 26, fontWeight: "900", letterSpacing: -1 },
  arcoTotal: { fontSize: 12, fontWeight: "700" },
  cardTitulo: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  cardApoio: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  metricasColuna: { flex: 0.9, gap: 12 },
  cardMetrica: {
    borderRadius: 22,
    flex: 1,
    justifyContent: "space-between",
    padding: 16,
  },
  iconeMetrica: {
    alignItems: "center",
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  numeroMetrica: { fontSize: 27, fontWeight: "900", letterSpacing: -0.8 },
  rotuloMetrica: { fontSize: 12, fontWeight: "700", lineHeight: 16 },
  social: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 132,
    padding: 18,
  },
  socialIcone: {
    alignItems: "center",
    borderRadius: 22,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  socialTexto: { flex: 1 },
  socialLink: { fontSize: 13, fontWeight: "800", marginTop: 8 },
  notaEtica: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  notaEticaTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
});
