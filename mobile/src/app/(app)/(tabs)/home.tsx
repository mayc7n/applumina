import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowUpRight, CheckCircle2, ChevronRight, Clock3 } from "lucide-react-native";
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
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { resumirSemana } from "@/features/dashboard/home-metrics";
import { useListaAmigos, useSolicitacoesAmizade } from "@/features/friends/hooks";
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
  const amigos = useListaAmigos(userId);
  const solicitacoes = useSolicitacoesAmizade(userId);
  const primeiroNome = usuario?.displayName?.trim().split(" ")[0];
  const data = new Intl.DateTimeFormat(idioma, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const tarefasHoje = consulta.data?.todayTasks ?? [];
  const tarefaPendente = tarefasHoje.find((tarefa) => tarefa.status !== "DONE");
  const resumo = resumirSemana(consulta.data?.weeklyData ?? []);
  const totalAmigos = amigos.data?.length ?? 0;
  const totalPedidos = solicitacoes.data?.length ?? 0;
  const mostrarAmigos =
    autenticado && (totalAmigos > 0 || totalPedidos > 0);

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
              onRefresh={() => {
                void consulta.refetch();
                void amigos.refetch();
                void solicitacoes.refetch();
              }}
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
              accessibilityLabel={traduzir("inicio.abrirConta")}
              accessibilityRole="button"
              onPress={() => router.push("/account")}
              style={({ pressed }) => [
                styles.avatarAcao,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
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
                    <LuminaMark decorativo tamanho={36} />
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
              styles.hoje,
              {
                backgroundColor: tema.cores.elevado,
                borderColor: tema.cores.borda,
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
              <FeedbackState
                aoAgir={() => void consulta.refetch()}
                descricao={traduzir("inicio.erroDescricao")}
                rotuloAcao={traduzir("comum.tentarNovamente")}
                tipo="erro"
                titulo={traduzir("inicio.erroTitulo")}
              />
            ) : (
              <>
                <Text style={[styles.tituloHoje, { color: tema.cores.texto }]}>
                  {!autenticado
                    ? traduzir("inicio.visitanteTitulo")
                    : tarefaPendente
                      ? traduzir("inicio.pendenteTitulo")
                      : traduzir("inicio.semRegistroTitulo")}
                </Text>
                <Text
                  style={[
                    styles.descricaoHoje,
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
                  accessibilityRole="button"
                  onPress={() =>
                    router.push(tarefaPendente ? "/tasks" : "/workouts")
                  }
                  style={({ pressed }) => [
                    styles.acaoHoje,
                    {
                      backgroundColor: tema.cores.marca,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.acaoHojeTexto,
                      { color: tema.cores.sobreMarca },
                    ]}
                  >
                    {!autenticado
                      ? traduzir("inicio.acaoExplorar")
                      : tarefaPendente
                        ? traduzir("inicio.acaoTarefa")
                        : traduzir("inicio.acaoTreino")}
                  </Text>
                  <ArrowUpRight color={tema.cores.sobreMarca} size={16} />
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

        {autenticado && consulta.data ? (
          <AnimatedEntry>
            <View style={styles.metricas}>
              <View
                style={[
                  styles.cardMetrica,
                  {
                    backgroundColor: tema.cores.elevado,
                    borderColor: tema.cores.borda,
                  },
                ]}
              >
                <Text style={[styles.numeroMetrica, { color: tema.cores.texto }]}>
                  {resumo.diasAtivos}
                </Text>
                <Text
                  style={[
                    styles.rotuloMetrica,
                    { color: tema.cores.textoSecundario },
                  ]}
                >
                  {traduzir("inicio.diasAtivosRotulo")}
                </Text>
              </View>
              <View
                style={[
                  styles.cardMetrica,
                  {
                    backgroundColor: tema.cores.elevado,
                    borderColor: tema.cores.borda,
                  },
                ]}
              >
                <CheckCircle2 color={tema.cores.sucesso} size={16} />
                <Text style={[styles.numeroMetrica, { color: tema.cores.texto }]}>
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
                  {
                    backgroundColor: tema.cores.elevado,
                    borderColor: tema.cores.borda,
                  },
                ]}
              >
                <Clock3 color={tema.cores.informacao} size={16} />
                <Text style={[styles.numeroMetrica, { color: tema.cores.texto }]}>
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
          </AnimatedEntry>
        ) : null}

        {mostrarAmigos ? (
          <AnimatedEntry>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/friends")}
              style={({ pressed }) => [
                styles.social,
                {
                  backgroundColor: pressed
                    ? tema.cores.sobreposicao
                    : tema.cores.elevado,
                  borderColor: tema.cores.borda,
                },
              ]}
            >
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
                  {totalPedidos > 0
                    ? traduzir("inicio.amigosPedidos", {
                        quantidade: totalPedidos,
                      })
                    : traduzir("inicio.amigosQuantidade", {
                        quantidade: totalAmigos,
                      })}
                </Text>
              </View>
              <ChevronRight color={tema.cores.textoSutil} size={20} />
            </Pressable>
          </AnimatedEntry>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  avatarAcao: { borderRadius: 20 },
  avatar: { borderRadius: 20, height: 40, width: 40 },
  avatarFallback: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  inicial: { fontSize: 16, fontWeight: "700" },
  hoje: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  sobretitulo: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  tituloHoje: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  descricaoHoje: { fontSize: 14, lineHeight: 20 },
  carga: { marginVertical: 24 },
  acaoHoje: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  acaoHojeTexto: { fontSize: 14, fontWeight: "700" },
  linkEntrar: { alignSelf: "flex-start", minHeight: 44, paddingVertical: 8 },
  linkEntrarTexto: { fontSize: 14, fontWeight: "700" },
  metricas: { flexDirection: "row", gap: 8 },
  cardMetrica: {
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 88,
    padding: 12,
  },
  numeroMetrica: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  rotuloMetrica: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
  social: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    padding: 14,
  },
  socialTexto: { flex: 1 },
  cardTitulo: { fontSize: 15, fontWeight: "700" },
  cardApoio: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
