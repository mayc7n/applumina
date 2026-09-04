import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowUpRight, Bell, ChevronRight } from "lucide-react-native";
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
import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { chavePainel } from "@/features/tasks/hooks";
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
  const consulta = useQuery({
    queryKey: chavePainel,
    queryFn: apiPainel.obter,
    enabled: autenticado,
  });
  const primeiroNome = usuario?.displayName?.trim().split(" ")[0];
  const data = new Intl.DateTimeFormat(idioma, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  const tarefasHoje = consulta.data?.todayTasks ?? [];
  const tarefaPendente = tarefasHoje.find((tarefa) => tarefa.status !== "DONE");
  const dadosSemana = consulta.data?.weeklyData ?? [];
  const diasAtivos = dadosSemana.filter(
    (dia) =>
      dia.tasksCompleted > 0 || dia.habitRate > 0 || dia.focusMins > 0,
  ).length;
  const tarefasConcluidas = dadosSemana.reduce(
    (total, dia) => total + dia.tasksCompleted,
    0,
  );
  const minutosFoco = dadosSemana.reduce(
    (total, dia) => total + dia.focusMins,
    0,
  );

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
              refreshing={consulta.isRefetching}
              onRefresh={() => void consulta.refetch()}
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
                  ? obterSaudacao(traduzir) +
                    (primeiroNome ? ", " + primeiroNome : "")
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
                backgroundColor: tema.cores.sobreposicao,
                borderColor: tema.cores.borda,
              },
            ]}
          >
            <Bell color={tema.cores.textoSutil} size={20} />
          </Pressable>
        </View>

        <View
          style={[
            styles.hoje,
            {
              backgroundColor: tema.cores.marcaSuave,
              borderColor: tema.cores.marcaContorno,
            },
          ]}
        >
          <Text style={[styles.sobretitulo, { color: tema.cores.marca }]}>
            {traduzir("inicio.hoje")}
          </Text>
          {consulta.isLoading && autenticado ? (
            <ActivityIndicator color={tema.cores.marca} style={styles.carga} />
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
              <AppButton
                accessibilityHint={
                  !autenticado
                    ? traduzir("inicio.visitanteSubtitulo")
                    : undefined
                }
                onPress={() =>
                  router.push(tarefaPendente ? "/tasks" : "/workouts")
                }
                rotulo={
                  !autenticado
                    ? traduzir("inicio.acaoExplorar")
                    : tarefaPendente
                      ? traduzir("inicio.acaoTarefa")
                      : traduzir("inicio.acaoTreino")
                }
                style={styles.acaoHoje}
              />
              {!autenticado ? (
                <Pressable
                  accessibilityRole="link"
                  hitSlop={10}
                  onPress={() => router.push("/login")}
                  style={styles.linkEntrar}
                >
                  <Text style={[styles.linkTexto, { color: tema.cores.marca }]}>
                    {traduzir("comum.entrar")}
                  </Text>
                  <ArrowUpRight color={tema.cores.marca} size={16} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>

        {autenticado && consulta.data ? (
          <>
            <View style={styles.secao}>
              <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                {traduzir("inicio.progressoTitulo")}
              </Text>
              <View style={styles.progresso}>
                <WeeklyArc
                  progresso={diasAtivos / 7}
                  rotulo={traduzir("inicio.diasAtivos", {
                    quantidade: diasAtivos,
                  })}
                />
                <View style={styles.progressoTexto}>
                  <Text style={[styles.diasAtivos, { color: tema.cores.texto }]}>
                    {traduzir("inicio.diasAtivos", {
                      quantidade: diasAtivos,
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.resumoSemana,
                      { color: tema.cores.textoSecundario },
                    ]}
                  >
                    {diasAtivos
                      ? traduzir("inicio.resumoSemana", {
                          tarefas: tarefasConcluidas,
                          minutos: minutosFoco,
                        })
                      : traduzir("inicio.semanaVazia")}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.retomada,
                { borderLeftColor: tema.cores.marcaContorno },
              ]}
            >
              <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                {traduzir("inicio.constanciaTitulo")}
              </Text>
              <Text
                style={[styles.textoSecao, { color: tema.cores.textoSecundario }]}
              >
                {consulta.data.longestStreak > 0
                  ? traduzir("inicio.retomada")
                  : traduzir("inicio.primeiroPasso")}
              </Text>
            </View>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/friends")}
          style={({ pressed }) => [
            styles.secaoAcao,
            {
              backgroundColor: pressed
                ? tema.cores.sobreposicao
                : tema.cores.fundo,
              borderColor: tema.cores.borda,
            },
          ]}
        >
          <View style={styles.secaoAcaoTexto}>
            <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
              {traduzir("inicio.amigosTitulo")}
            </Text>
            <Text
              style={[styles.textoSecao, { color: tema.cores.textoSecundario }]}
            >
              {traduzir("inicio.amigosVazio")}
            </Text>
            <Text style={[styles.linkTexto, { color: tema.cores.marca }]}>
              {traduzir("inicio.verAmigos")}
            </Text>
          </View>
          <ChevronRight color={tema.cores.textoSutil} size={20} />
        </Pressable>

        {autenticado && consulta.data ? (
          <View style={styles.secao}>
            <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
              {traduzir("inicio.proximoTitulo")}
            </Text>
            <Text style={[styles.proximoTexto, { color: tema.cores.texto }]}>
              {traduzir(
                tarefaPendente
                  ? "inicio.proximoTarefa"
                  : "inicio.proximoLivre",
              )}
            </Text>
            <Text
              style={[
                styles.explicacao,
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
    gap: 28,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  cabecalho: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  identidade: { alignItems: "center", flexDirection: "row", flex: 1, gap: 12 },
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
  saudacao: { fontSize: 20, fontWeight: "800", letterSpacing: -0.35 },
  data: { fontSize: 13, textTransform: "capitalize" },
  botaoIcone: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  hoje: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  sobretitulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  tituloHoje: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.65,
    lineHeight: 31,
  },
  descricaoHoje: { fontSize: 15, lineHeight: 22, marginTop: 9 },
  carga: { marginVertical: 34 },
  acaoHoje: { alignSelf: "stretch", marginTop: 20 },
  linkEntrar: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  linkTexto: { fontSize: 14, fontWeight: "700" },
  secao: { gap: 12 },
  tituloSecao: { fontSize: 19, fontWeight: "700", letterSpacing: -0.25 },
  textoSecao: { fontSize: 14, lineHeight: 21 },
  progresso: { alignItems: "center", flexDirection: "row", gap: 18 },
  progressoTexto: { flex: 1, gap: 6 },
  diasAtivos: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  resumoSemana: { fontSize: 13, lineHeight: 19 },
  retomada: { borderLeftWidth: 3, gap: 7, paddingLeft: 16 },
  secaoAcao: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginHorizontal: -20,
    minHeight: 120,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  secaoAcaoTexto: { flex: 1, gap: 8 },
  proximoTexto: { fontSize: 16, fontWeight: "600", lineHeight: 22 },
  explicacao: { fontSize: 12, lineHeight: 18 },
});
