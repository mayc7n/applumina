import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { ChevronLeft } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkoutForm } from "@/components/workouts/workout-form";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCriarTreino } from "@/features/workouts/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { apiTreinos } from "@/lib/api/resources";
import { useTemaApp } from "@/theme/theme";
import type { CreateWorkoutInput } from "@/types/api";

export default function TelaNovoTreino() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const parametros = useLocalSearchParams<{ date?: string }>();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const criar = useCriarTreino(userId);

  async function salvar(entrada: CreateWorkoutInput): Promise<void> {
    const treino = await criar.mutateAsync(entrada);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(traduzir("treinos.momentoTitulo"), traduzir("treinos.momentoDescricao"), [
      { text: traduzir("treinos.agoraNao"), style: "cancel", onPress: () => router.back() },
      { text: traduzir("treinos.tirarFoto"), onPress: () => void escolherMomento(treino.id, "camera") },
      { text: traduzir("treinos.escolherFoto"), onPress: () => void escolherMomento(treino.id, "biblioteca") },
    ]);
  }

  async function escolherMomento(workoutId: string, origem: "camera" | "biblioteca"): Promise<void> {
    const permissao = origem === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) { Alert.alert(traduzir("treinos.permissaoFoto")); router.back(); return; }
    const resultado = origem === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.82, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.82, exif: false });
    if (!resultado.canceled) {
      try {
        const processada = await ImageManipulator.manipulateAsync(resultado.assets[0].uri, [{ resize: { width: 1600 } }], { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG });
        await apiTreinos.enviarMomento(workoutId, processada.uri, "image/jpeg");
      }
      catch { Alert.alert(traduzir("treinos.erroMomento")); }
    }
    router.back();
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
              autenticado ? traduzir("treinos.novoSubtitulo") : undefined
            }
            titulo={traduzir("treinos.novoTitulo")}
          />
          {autenticado ? (
            <WorkoutForm aoSalvar={salvar} dataInicial={parametros.date} salvando={criar.isPending} />
          ) : (
            <View style={styles.visitante}>
              <FeedbackState
                aoAgir={() => router.replace("/login")}
                descricao={traduzir("treinos.visitanteDescricao")}
                rotuloAcao={traduzir("comum.entrar")}
                titulo={traduzir("treinos.vazioTitulo")}
              />
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
  visitante: { marginTop: 24 },
});
