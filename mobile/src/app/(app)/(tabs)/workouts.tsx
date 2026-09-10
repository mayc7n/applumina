import { router } from "expo-router";
import { Activity, Bike, Dumbbell, Footprints, Plus, Waves } from "lucide-react-native";
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

import { WorkoutRow } from "@/components/workouts/workout-row";
import { AppButton } from "@/components/ui/app-button";
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useListaTreinos } from "@/features/workouts/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { WorkoutType } from "@/types/api";

export default function TelaTreinos() {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const consulta = useListaTreinos(userId);
  const modalidadesVisitante = [
    { Icone: Footprints, texto: traduzir("treinos.modalidadePassos") },
    { Icone: Activity, texto: traduzir("treinos.modalidadeForca") },
    { Icone: Bike, texto: traduzir("treinos.modalidadeEsportes") },
    { Icone: Waves, texto: traduzir("treinos.modalidadeOutras") },
  ];
  const rotulos: Record<WorkoutType, string> = {
    WALKING: traduzir("treinos.caminhada"),
    RUNNING: traduzir("treinos.corrida"),
    STRENGTH: traduzir("treinos.forca"),
    CYCLING: traduzir("treinos.ciclismo"),
    SWIMMING: traduzir("treinos.natacao"),
    MARTIAL_ARTS: traduzir("treinos.artesMarciais"),
    TEAM_SPORT: traduzir("treinos.esporteColetivo"),
    YOGA: traduzir("treinos.yoga"),
    MOBILITY: traduzir("treinos.mobilidade"),
    PILATES: traduzir("treinos.pilates"),
    CUSTOM: traduzir("treinos.personalizada"),
  };

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
      >
        <ScreenHeader titulo={traduzir("treinos.titulo")} />

        {!autenticado ? (
          <AnimatedEntry>
            <View
              style={[
                styles.introducao,
                {
                  backgroundColor: tema.cores.marcaSuave,
                  borderColor: tema.cores.marcaContorno,
                },
              ]}
            >
              <View style={[styles.iconeDestaque, { backgroundColor: tema.cores.elevado }]}>
                <Dumbbell color={tema.cores.marca} size={26} />
              </View>
              <Text style={[styles.titulo, { color: tema.cores.texto }]}>
                {traduzir("treinos.titulo")}
              </Text>
              <Text
                style={[styles.descricao, { color: tema.cores.textoSecundario }]}
              >
                {traduzir("treinos.visitanteDescricao")}
              </Text>
            </View>
            <View style={styles.modalidades}>
              {modalidadesVisitante.map(({ Icone, texto }) => (
                <View
                  key={texto}
                  style={[
                    styles.modalidade,
                    {
                      backgroundColor: tema.cores.elevado,
                      borderColor: tema.cores.borda,
                    },
                  ]}
                >
                  <View style={[styles.iconeModalidade, { backgroundColor: tema.cores.marcaSuave }]}>
                    <Icone color={tema.cores.marca} size={21} />
                  </View>
                  <Text
                    style={[styles.modalidadeTexto, { color: tema.cores.texto }]}
                  >
                    {texto}
                  </Text>
                </View>
              ))}
            </View>
            <AppButton
              onPress={() => router.push("/login")}
              rotulo={traduzir("comum.entrar")}
            />
          </AnimatedEntry>
        ) : (
          <>
            <AnimatedEntry>
              <Pressable
                accessibilityLabel={traduzir("treinos.registrar")}
                accessibilityRole="button"
                onPress={() => router.push("/workouts/new")}
                style={({ pressed }) => [
                  styles.acaoPrincipal,
                  {
                    backgroundColor: pressed
                      ? tema.cores.marcaPressionada
                      : tema.cores.marca,
                  },
                ]}
              >
                <View style={styles.acaoTexto}>
                  <Text style={[styles.acaoTitulo, { color: tema.cores.sobreMarca }]}>
                    {traduzir("treinos.registrar")}
                  </Text>
                  <Text style={[styles.acaoDescricao, { color: tema.cores.sobreMarca }]}>
                    {traduzir("treinos.acaoRapidaDescricao")}
                  </Text>
                </View>
                <View style={[styles.acaoIcone, { backgroundColor: tema.cores.sobreMarca }]}>
                  <Plus color={tema.cores.marca} size={24} />
                </View>
              </Pressable>
            </AnimatedEntry>

            {consulta.isLoading ? (
          <ActivityIndicator
            color={tema.cores.marca}
            size="large"
            style={styles.carregando}
          />
            ) : consulta.isError ? (
          <FeedbackState
            aoAgir={() => void consulta.refetch()}
            descricao={traduzir("treinos.erroDescricao")}
            rotuloAcao={traduzir("comum.tentarNovamente")}
            tipo="erro"
            titulo={traduzir("treinos.erroTitulo")}
          />
            ) : consulta.data?.length ? (
          <View style={styles.historico}>
            <View style={styles.cabecalhoHistorico}>
              <Text style={[styles.historicoTitulo, { color: tema.cores.texto }]}>
                {traduzir("treinos.historicoTitulo")}
              </Text>
              <View style={[styles.contagem, { backgroundColor: tema.cores.sobreposicao }]}>
                <Text style={[styles.contagemTexto, { color: tema.cores.textoSecundario }]}>
                  {traduzir("treinos.totalRegistros", { quantidade: consulta.data.length })}
                </Text>
              </View>
            </View>
            <View style={styles.lista}>
            {consulta.data.map((treino) => (
              <WorkoutRow
                aoEditar={() =>
                  router.push({
                    pathname: "/workouts/[id]",
                    params: { id: treino.id },
                  })
                }
                idioma={idioma}
                key={treino.id}
                rotuloEditar={traduzir("treinos.editarAcessibilidade", {
                  treino: treino.customActivity || rotulos[treino.type],
                })}
                rotuloMinutos={traduzir("treinos.minutos", {
                  quantidade: treino.durationMins,
                })}
                rotuloTipo={rotulos[treino.type]}
                treino={treino}
              />
            ))}
            </View>
          </View>
            ) : (
          <FeedbackState
            aoAgir={() => router.push("/workouts/new")}
            descricao={traduzir("treinos.vazioDescricao")}
            rotuloAcao={traduzir("treinos.registrar")}
            titulo={traduzir("treinos.vazioTitulo")}
          />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 22, padding: 20, paddingBottom: 36 },
  introducao: {
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  iconeDestaque: {
    alignItems: "center",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    marginBottom: 4,
    width: 50,
  },
  titulo: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  descricao: { fontSize: 15, lineHeight: 22 },
  modalidades: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 16 },
  modalidade: {
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: "47%",
    flexGrow: 1,
    gap: 12,
    minHeight: 132,
    padding: 16,
  },
  iconeModalidade: { alignItems: "center", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  modalidadeTexto: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  acaoPrincipal: { alignItems: "center", borderRadius: 24, flexDirection: "row", gap: 16, minHeight: 112, padding: 20 },
  acaoTexto: { flex: 1, gap: 5 },
  acaoTitulo: { fontSize: 21, fontWeight: "800", lineHeight: 27 },
  acaoDescricao: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  acaoIcone: { alignItems: "center", borderRadius: 24, height: 48, justifyContent: "center", width: 48 },
  carregando: { marginTop: 42 },
  historico: { gap: 14 },
  cabecalhoHistorico: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  historicoTitulo: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  contagem: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  contagemTexto: { fontSize: 12, fontWeight: "700", lineHeight: 16 },
  lista: { gap: 10 },
});
