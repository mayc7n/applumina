import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Activity,
  ArrowUpRight,
  CheckSquare2,
  CheckCircle2,
  Plus,
  Sprout,
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
import { ScreenHeader } from "@/components/ui/screen-header";
import { WeekRhythm } from "@/components/progress/week-rhythm";
import {
  criarDiasRitmoSemana,
  resumirSemana,
} from "@/features/dashboard/home-metrics";
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
  const diasRitmo = consulta.data
    ? criarDiasRitmoSemana(
        consulta.data.weeklyData,
        new Date(),
        idioma,
        traduzir("inicio.ritmoDiaAtivo"),
        traduzir("inicio.ritmoDiaVazio"),
      )
    : [];
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
        <ScreenHeader
          inicio={
            <Pressable
              accessibilityLabel={traduzir("conta.titulo")}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push("/account")}
              style={({ pressed }) => [
                styles.avatarPressable,
                { opacity: pressed ? 0.76 : 1 },
              ]}
            >
              {usuario?.avatarUrl ? (
                <Image
                  accessible={false}
                  contentFit="cover"
                  source={{ uri: usuario.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  accessible={false}
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
                    <LuminaMark decorativo tamanho={34} />
                  )}
                </View>
              )}
            </Pressable>
          }
          subtitulo={data}
          titulo={
            autenticado
              ? `${obterSaudacao(traduzir)}${
                  primeiroNome ? `, ${primeiroNome}` : ""
                }`
              : traduzir("inicio.visitanteSaudacao")
          }
        />

        <AnimatedEntry>
          <View
            style={[
              styles.hero,
              {
                backgroundColor: tema.cores.elevado,
                borderColor: tema.cores.marcaContorno,
              },
            ]}
          >
            <Text style={[styles.sobretitulo, { color: tema.cores.marca }]}>
              {traduzir("inicio.hoje")}
            </Text>
            {consulta.isLoading && autenticado ? (
              <ActivityIndicator
                color={tema.cores.marca}
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
                  style={[styles.tituloHero, { color: tema.cores.texto }]}
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
                    { color: tema.cores.textoSecundario },
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
                  accessibilityLabel={
                    !autenticado
                      ? traduzir("inicio.acaoExplorar")
                      : tarefaPendente
                        ? traduzir("inicio.acaoTarefa")
                        : traduzir("inicio.acaoTreino")
                  }
                  accessibilityRole="button"
                  android_ripple={{ color: "#0000001F" }}
                  onPress={() =>
                    router.push(tarefaPendente ? "/tasks" : "/workouts")
                  }
                  style={({ pressed }) => [
                    styles.acaoHero,
                    {
                      backgroundColor: tema.cores.marca,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.acaoHeroTexto, { color: tema.cores.sobreMarca }]}
                  >
                    {!autenticado
                      ? traduzir("inicio.acaoExplorar")
                      : tarefaPendente
                        ? traduzir("inicio.acaoTarefa")
                        : traduzir("inicio.acaoTreino")}
                  </Text>
                  <ArrowUpRight color={tema.cores.sobreMarca} size={18} />
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
                        { color: tema.cores.marca },
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

        {autenticado ? (
          <AnimatedEntry>
            <View style={styles.acoesRapidas}>
              <Text style={[styles.rotuloAcoes, { color: tema.cores.textoSutil }]}>
                {traduzir("inicio.acoesRapidas")}
              </Text>
              <View style={styles.linhaAcoes}>
                <Pressable
                  accessibilityLabel={traduzir("inicio.novaTarefa")}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.push("/tasks/new")}
                  style={({ pressed }) => [
                    styles.acaoRapida,
                    {
                      backgroundColor: tema.cores.elevado,
                      borderColor: tema.cores.borda,
                      opacity: pressed ? 0.76 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconeAcaoRapida,
                      { backgroundColor: tema.cores.marcaSuave },
                    ]}
                  >
                    <CheckSquare2 color={tema.cores.marca} size={19} />
                  </View>
                  <Text style={[styles.textoAcaoRapida, { color: tema.cores.texto }]}>
                    {traduzir("inicio.novaTarefa")}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={traduzir("inicio.novoTreino")}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.push("/workouts/new")}
                  style={({ pressed }) => [
                    styles.acaoRapida,
                    {
                      backgroundColor: tema.cores.elevado,
                      borderColor: tema.cores.borda,
                      opacity: pressed ? 0.76 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconeAcaoRapida,
                      { backgroundColor: tema.cores.marcaSuave },
                    ]}
                  >
                    <Plus color={tema.cores.marca} size={20} />
                  </View>
                  <Text style={[styles.textoAcaoRapida, { color: tema.cores.texto }]}>
                    {traduzir("inicio.novoTreino")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </AnimatedEntry>
        ) : null}

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

                <WeekRhythm
                  descricao={traduzir("inicio.ritmoDescricao", {
                    quantidade: resumo.diasAtivos,
                  })}
                  dias={diasRitmo}
                  titulo={traduzir("inicio.ritmoTitulo")}
                />

                <View
                  style={[
                    styles.metricasAtividade,
                    metricasAmpliadas && styles.metricasAtividadeAmpliadas,
                  ]}
                >
                  <View
                    style={[
                      styles.metricaAtividade,
                      styles.metricaCompacta,
                      metricasAmpliadas && styles.metricaAtividadeAmpliada,
                      {
                        backgroundColor: tema.cores.sobreposicao,
                        borderColor: tema.cores.borda,
                      },
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
                      style={styles.valorMetricaCompacta}
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
                      styles.metricaCompacta,
                      metricasAmpliadas && styles.metricaAtividadeAmpliada,
                      {
                        backgroundColor: tema.cores.sobreposicao,
                        borderColor: tema.cores.borda,
                      },
                    ]}
                  >
                    <View
                      accessible
                      accessibilityLabel={`${traduzir("inicio.focoRotulo")}: ${traduzir("inicio.minutos", { quantidade: resumo.minutosFoco })}`}
                      style={styles.valorMetricaCompacta}
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

        {autenticado && consulta.data ? (
          <View
            style={[
              styles.notaEtica,
              { backgroundColor: tema.cores.alertaSuave },
            ]}
          >
            <Sprout color={tema.cores.alerta} size={18} />
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
  avatarPressable: { borderRadius: 21 },
  avatar: { borderRadius: 21, height: 42, width: 42 },
  avatarFallback: {
    alignItems: "center",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  inicial: { fontSize: 19, fontWeight: "800" },
  hero: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 16,
    borderWidth: 1,
    minHeight: 200,
    overflow: "hidden",
    padding: 20,
  },
  sobretitulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 12,
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
  carga: { marginVertical: 52 },
  estadoHero: { borderRadius: 18, padding: 16 },
  acaoHero: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 46,
    overflow: "hidden",
    paddingHorizontal: 18,
  },
  acaoHeroTexto: { fontSize: 15, fontWeight: "800" },
  linkEntrar: { alignSelf: "flex-start", minHeight: 44, paddingVertical: 12 },
  linkEntrarTexto: { fontSize: 14, fontWeight: "700", opacity: 0.9 },
  acoesRapidas: { gap: 10 },
  rotuloAcoes: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  linhaAcoes: { flexDirection: "row", gap: 10 },
  acaoRapida: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 62,
    paddingHorizontal: 12,
  },
  iconeAcaoRapida: {
    alignItems: "center",
    borderRadius: 13,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  textoAcaoRapida: { flex: 1, fontSize: 13, fontWeight: "800" },
  blocoSemana: { gap: 14 },
  tituloSecao: { fontSize: 21, fontWeight: "800", letterSpacing: -0.45 },
  cardAtividade: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
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
    marginVertical: 18,
  },
  metricasAtividadeAmpliadas: { alignItems: "center", flexDirection: "column", gap: 20 },
  metricaAtividade: { alignItems: "center", flex: 1, gap: 7 },
  metricaCompacta: {
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 84,
    paddingHorizontal: 10,
  },
  metricaAtividadeAmpliada: { flex: 0, width: "100%" },
  anelMetrica: { alignItems: "center", justifyContent: "center" },
  valorAnel: {
    alignItems: "baseline",
    flexDirection: "row",
    position: "absolute",
  },
  valorMetricaCompacta: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 2,
  },
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
  notaEtica: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  notaEticaTexto: { flex: 1, fontSize: 12, lineHeight: 18 },
});
