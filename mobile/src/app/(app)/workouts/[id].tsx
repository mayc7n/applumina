import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkoutForm } from "@/components/workouts/workout-form";
import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  useEditarTreino,
  useExcluirTreino,
  useTreino,
} from "@/features/workouts/hooks";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { apiTreinos } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { CreateWorkoutInput, Workout, WorkoutType } from "@/types/api";

function DetalheTreino({ treino, traduzir, onEditar, onExcluir, onMomento }: { treino: Workout; traduzir: ReturnType<typeof useIdioma>["traduzir"]; onEditar: () => void; onExcluir: () => void; onMomento: () => void }) {
  const tema = useTemaApp();
  const rotulos: Partial<Record<WorkoutType, string>> = {
    WALKING: traduzir("treinos.caminhada"), RUNNING: traduzir("treinos.corrida"), STRENGTH: traduzir("treinos.forca"), CYCLING: traduzir("treinos.ciclismo"), SWIMMING: traduzir("treinos.natacao"), CUSTOM: traduzir("treinos.personalizada"),
  };
  return <View style={styles.detalhe}>
    <View style={styles.detalheCabecalho}><Text style={[styles.detalheTipo, { color: tema.cores.texto }]}>{treino.customActivity || rotulos[treino.type] || treino.type}</Text><Text style={[styles.detalheData, { color: tema.cores.textoSecundario }]}>{treino.activityDate}</Text></View>
    <Text style={[styles.detalheDuracao, { color: tema.cores.marca }]}>{treino.durationMins} {traduzir("treinos.minutos")}</Text>
    {treino.notes ? <Text style={[styles.detalheNotas, { color: tema.cores.textoSecundario }]}>{treino.notes}</Text> : null}
    <AppButton onPress={onMomento} rotulo={traduzir("treinos.adicionarMomento")} variante="secondary" />
    <AppButton onPress={onEditar} rotulo={traduzir("treinos.editar")} />
    <AppButton onPress={onExcluir} rotulo={traduzir("treinos.excluir")} variante="danger" />
  </View>;
}

export default function TelaEditarTreino() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const parametros = useLocalSearchParams<{ id: string; moment?: string }>();
  const [editando, definirEditando] = useState(false);
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const consulta = useTreino(parametros.id, userId);
  const editar = useEditarTreino(userId);
  const excluir = useExcluirTreino(userId);

  useEffect(() => {
    if (parametros.moment !== "1" || !consulta.data) return;
    void adicionarMomento();
  }, [consulta.data, parametros.moment]);

  async function adicionarMomento(): Promise<void> {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.82, exif: false });
    if (resultado.canceled) return;
    const processada = await ImageManipulator.manipulateAsync(resultado.assets[0].uri, [{ resize: { width: 1600 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
    await apiTreinos.enviarMomento(parametros.id, processada.uri, "image/jpeg");
  }

  async function salvar(entrada: CreateWorkoutInput): Promise<void> {
    await editar.mutateAsync({ id: parametros.id, entrada });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  function confirmarExclusao(): void {
    Alert.alert(
      traduzir("treinos.confirmarExclusaoTitulo"),
      traduzir("treinos.confirmarExclusaoDescricao"),
      [
        { style: "cancel", text: traduzir("treinos.cancelar") },
        {
          style: "destructive",
          text: traduzir("treinos.confirmarExclusao"),
          onPress: () =>
            void excluir
              .mutateAsync(parametros.id)
              .then(() => {
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                router.back();
              })
              .catch((erro) => {
                Alert.alert(
                  traduzir("treinos.erroExcluir"),
                  obterMensagemErroApi(
                    erro,
                    traduzir("comum.erroPadrao"),
                    false,
                  ),
                );
              }),
        },
      ],
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.tela}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            inicio={
              <Pressable
                accessibilityLabel={traduzir("treinos.voltar")}
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.voltar,
                  {
                    backgroundColor: pressed
                      ? tema.cores.borda
                      : tema.cores.sobreposicao,
                  },
                ]}
              >
                <ChevronLeft color={tema.cores.texto} size={24} />
              </Pressable>
            }
            subtitulo={
              autenticado ? traduzir("treinos.editarSubtitulo") : undefined
            }
            titulo={traduzir("treinos.editarTitulo")}
          />
          {!autenticado ? (
            <View style={styles.estado}>
              <FeedbackState
                aoAgir={() => router.replace("/login")}
                descricao={traduzir("treinos.visitanteDescricao")}
                rotuloAcao={traduzir("comum.entrar")}
                titulo={traduzir("treinos.vazioTitulo")}
              />
            </View>
          ) : consulta.isLoading ? (
            <ActivityIndicator
              accessibilityLabel={traduzir("treinos.carregando")}
              color={tema.cores.marca}
              size="large"
              style={styles.estado}
            />
          ) : consulta.isError || !consulta.data ? (
            <View style={styles.estado}>
              <FeedbackState
                aoAgir={() => void consulta.refetch()}
                descricao={traduzir("treinos.erroDetalheDescricao")}
                rotuloAcao={traduzir("comum.tentarNovamente")}
                tipo="erro"
                titulo={traduzir("treinos.erroDetalheTitulo")}
              />
            </View>
          ) : (
            <View style={styles.formulario}>
              {editando ? <>
                <WorkoutForm aoSalvar={salvar} salvando={editar.isPending || excluir.isPending} treino={consulta.data} />
                <AppButton disabled={editar.isPending || excluir.isPending} onPress={() => definirEditando(false)} rotulo={traduzir("treinos.cancelar")} variante="secondary" />
              </> : <DetalheTreino onEditar={() => definirEditando(true)} onExcluir={confirmarExclusao} onMomento={() => void adicionarMomento()} treino={consulta.data} traduzir={traduzir} />}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  voltar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  estado: { marginTop: 40 },
  formulario: { gap: 16 },
  detalhe: { gap: 16 },
  detalheCabecalho: { gap: 5 },
  detalheTipo: { fontSize: 24, fontWeight: "800" },
  detalheData: { fontSize: 15 },
  detalheDuracao: { fontSize: 32, fontWeight: "800" },
  detalheNotas: { fontSize: 16, lineHeight: 23 },
});
