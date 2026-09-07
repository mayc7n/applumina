import { router } from "expo-router";
import { Activity, Bike, Footprints, Plus, Waves } from "lucide-react-native";
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
  const consulta = useListaTreinos(autenticado);
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
        <ScreenHeader
          acao={
            autenticado ? (
              <Pressable
                accessibilityLabel={traduzir("treinos.registrar")}
                accessibilityRole="button"
                onPress={() => router.push("/workouts/new")}
                style={({ pressed }) => [
                  styles.acaoCabecalho,
                  {
                    backgroundColor: pressed
                      ? tema.cores.marcaContorno
                      : tema.cores.marcaSuave,
                  },
                ]}
              >
                <Plus color={tema.cores.marca} size={23} />
              </Pressable>
            ) : undefined
          }
          subtitulo={autenticado ? traduzir("treinos.subtitulo") : undefined}
          titulo={traduzir("treinos.titulo")}
        />

        {!autenticado ? (
          <>
            <View style={styles.introducao}>
              <Text style={[styles.titulo, { color: tema.cores.texto }]}>
                {traduzir("treinos.vazioTitulo")}
              </Text>
              <Text
                style={[styles.descricao, { color: tema.cores.textoSecundario }]}
              >
                {traduzir("treinos.visitanteDescricao")}
              </Text>
            </View>
            <View
              style={[styles.modalidades, { borderColor: tema.cores.borda }]}
            >
              {modalidadesVisitante.map(({ Icone, texto }) => (
                <View
                  key={texto}
                  style={[
                    styles.modalidade,
                    { borderBottomColor: tema.cores.borda },
                  ]}
                >
                  <Icone color={tema.cores.marca} size={20} />
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
          </>
        ) : consulta.isLoading ? (
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
        ) : (
          <FeedbackState
            aoAgir={() => router.push("/workouts/new")}
            descricao={traduzir("treinos.vazioDescricao")}
            rotuloAcao={traduzir("treinos.registrar")}
            titulo={traduzir("treinos.vazioTitulo")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 22, padding: 20, paddingBottom: 36 },
  acaoCabecalho: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  introducao: { gap: 9, maxWidth: 560 },
  titulo: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  descricao: { fontSize: 15, lineHeight: 22 },
  modalidades: { borderBottomWidth: 1, borderTopWidth: 1 },
  modalidade: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 13,
    minHeight: 56,
    paddingHorizontal: 4,
  },
  modalidadeTexto: { flex: 1, fontSize: 15, lineHeight: 21 },
  carregando: { marginTop: 42 },
  lista: { marginTop: -4 },
});
