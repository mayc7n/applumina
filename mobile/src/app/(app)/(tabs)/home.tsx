import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
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
  useWindowDimensions,
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
  const { fontScale } = useWindowDimensions();
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
  const metricasAmpliadas = fontScale >= 1.3;
  const tamanhoAnel = metricasAmpliadas ? 112 : 84;

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
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.orbeMaior,
                { backgroundColor: tema.cores.sobreMarca },
              ]}
            />
            <View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[
                styles.orbeMenor,
                { backgroundColor: tema.cores.sobreMarca },
              ]}
            />
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={[
                styles.planoHero,
                {
                  backgroundColor: tema.cores.sobreMarca,
                  borderColor: tema.cores.sobreMarca,
                },
              ]}
            />
            <View style={styles.heroTopo}>
              <View style={styles.hojePill}>
                <View style={[styles.hojePonto, { backgroundColor: tema.cores.sobreMarca }]} />
                <Text style={[styles.sobretitulo, { color: tema.cores.sobreMarca }]}>
                  {traduzir("inicio.hoje")}
                </Text>
              </View>
              <View style={styles.heroSelo}>
                <CheckCircle2 color={tema.cores.sobreMarca} size={24} />
              </View>
            </View>
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
                  android_ripple={{ color: "#0000001F" }}
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
              <View
                style={[
                  styles.cardAtividade,
                  {
                    backgroundColor: tema.cores.elevado,
                    borderColor: tema.cores.borda,
                  },
                ]}
              >
                <View style={styles.cabecalhoAtividade}>
                  <View
                    style={[
                      styles.iconeAtividade,
                      { backgroundColor: tema.cores.marcaSuave },
                    ]}
                  >
                    <Activity color={tema.cores.marca} size={21} />
                  </View>
                  <View style={styles.textoAtividade}>
                    <Text
                      style={[styles.tituloSecao, { color: tema.cores.texto }]}
                    >
                      {traduzir("inicio.progressoTitulo")}
                    </Text>
                    <Text
                      style={[
                        styles.subtituloAtividade,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.atividadeSemanal")}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.metricasAtividade,
                    metricasAmpliadas && styles.metricasAtividadeAmpliadas,
                  ]}
                >
                  <View
                    style={[
                      styles.metricaAtividade,
                      metricasAmpliadas && styles.metricaAtividadeAmpliada,
                    ]}
                  >
                    <View style={styles.anelMetrica}>
                      <WeeklyArc
                        progresso={resumo.diasAtivos / 7}
                        rotulo={traduzir("inicio.diasAtivos", {
                          quantidade: resumo.diasAtivos,
                        })}
                        tamanho={tamanhoAnel}
                      />
                      <View
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        style={styles.valorAnel}
                      >
                        <Text
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                          numberOfLines={1}
                          style={[
                            styles.numeroAnel,
                            { color: tema.cores.texto },
                          ]}
                        >
                          {resumo.diasAtivos}
                        </Text>
                        <Text
                          style={[
                            styles.unidadeAnel,
                            { color: tema.cores.textoSutil },
                          ]}
                        >
                          /7
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.rotuloAnel,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.diasAtivosRotulo")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricaAtividade,
                      metricasAmpliadas && styles.metricaAtividadeAmpliada,
                    ]}
                  >
                    <View
                      accessible
                      accessibilityLabel={`${traduzir("inicio.tarefasRotulo")}: ${resumo.tarefasConcluidas}`}
                      style={[
                        styles.anelResumo,
                        metricasAmpliadas && styles.anelResumoAmpliado,
                        {
                          backgroundColor: tema.cores.sucessoSuave,
                          borderColor: tema.cores.sucesso,
                        },
                      ]}
                    >
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        numberOfLines={1}
                        style={[styles.numeroAnel, { color: tema.cores.texto }]}
                      >
                        {resumo.tarefasConcluidas}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rotuloAnel,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.tarefasRotulo")}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.metricaAtividade,
                      metricasAmpliadas && styles.metricaAtividadeAmpliada,
                    ]}
                  >
                    <View
                      accessible
                      accessibilityLabel={`${traduzir("inicio.focoRotulo")}: ${traduzir("inicio.minutos", { quantidade: resumo.minutosFoco })}`}
                      style={[
                        styles.anelResumo,
                        metricasAmpliadas && styles.anelResumoAmpliado,
                        {
                          backgroundColor: tema.cores.informacaoSuave,
                          borderColor: tema.cores.informacao,
                        },
                      ]}
                    >
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                        numberOfLines={1}
                        style={[styles.numeroAnel, { color: tema.cores.texto }]}
                      >
                        {resumo.minutosFoco}
                      </Text>
                      <Text
                        style={[
                          styles.unidadeAnel,
                          { color: tema.cores.textoSutil },
                        ]}
                      >
                        min
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.rotuloAnel,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {traduzir("inicio.focoRotulo")}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.metaAtividade,
                    {
                      backgroundColor: tema.cores.sobreposicao,
                      borderColor: tema.cores.borda,
                    },
                  ]}
                >
                  <CheckCircle2 color={tema.cores.sucesso} size={20} />
                  <View style={styles.textoMeta}>
                    <Text
                      style={[styles.tituloMeta, { color: tema.cores.texto }]}
                    >
                      {traduzir("inicio.constanciaTitulo")}
                    </Text>
                    <Text
                      style={[
                        styles.descricaoMeta,
                        { color: tema.cores.textoSecundario },
                      ]}
                    >
                      {resumo.diasAtivos
                        ? traduzir("inicio.retomada")
                        : traduzir("inicio.primeiroPasso")}
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
    elevation: 7,
    shadowColor: "#2B1712",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
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
  planoHero: {
    borderRadius: 34,
    borderWidth: 1,
    bottom: -116,
    height: 230,
    opacity: 0.08,
    position: "absolute",
    right: -52,
    transform: [{ rotate: "-15deg" }],
    width: 260,
  },
  sobretitulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroTopo: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  hojePill: { alignItems: "center", backgroundColor: "#FFFFFF1F", borderRadius: 999, flexDirection: "row", gap: 8, minHeight: 34, paddingHorizontal: 12 },
  hojePonto: { borderRadius: 4, height: 7, width: 7 },
  heroSelo: { alignItems: "center", backgroundColor: "#FFFFFF1A", borderRadius: 18, height: 40, justifyContent: "center", width: 40 },
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
    overflow: "hidden",
    paddingHorizontal: 18,
  },
  acaoHeroTexto: { fontSize: 15, fontWeight: "800" },
  linkEntrar: { alignSelf: "flex-start", minHeight: 44, paddingVertical: 12 },
  linkEntrarTexto: { fontSize: 14, fontWeight: "700", opacity: 0.9 },
  blocoSemana: { gap: 14 },
  tituloSecao: { fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  cardAtividade: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 2,
    shadowColor: "#2B1712",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cabecalhoAtividade: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  iconeAtividade: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  textoAtividade: { flex: 1, gap: 2 },
  subtituloAtividade: { fontSize: 13 },
  metricasAtividade: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 24,
  },
  metricasAtividadeAmpliadas: { alignItems: "center", flexDirection: "column", gap: 20 },
  metricaAtividade: { alignItems: "center", flex: 1, gap: 7 },
  metricaAtividadeAmpliada: { flex: 0, width: "100%" },
  anelMetrica: { alignItems: "center", justifyContent: "center" },
  valorAnel: {
    alignItems: "baseline",
    flexDirection: "row",
    position: "absolute",
  },
  anelResumo: {
    alignItems: "center",
    borderRadius: 42,
    borderWidth: 4,
    elevation: 2,
    height: 84,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    width: 84,
  },
  anelResumoAmpliado: { borderRadius: 56, height: 112, width: 112 },
  numeroAnel: { fontSize: 22, fontWeight: "900", letterSpacing: -0.7 },
  unidadeAnel: { fontSize: 10, fontWeight: "700" },
  rotuloAnel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  metaAtividade: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 72,
    padding: 14,
  },
  textoMeta: { flex: 1 },
  tituloMeta: { fontSize: 14, fontWeight: "800" },
  descricaoMeta: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  cardTitulo: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 21,
  },
  cardApoio: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  social: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 132,
    padding: 18,
    elevation: 2,
    shadowColor: "#2B1712",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
