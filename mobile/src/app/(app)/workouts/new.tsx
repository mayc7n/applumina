import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import {
  KeyboardAvoidingView,
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
import { useTemaApp } from "@/theme/theme";
import type { CreateWorkoutInput } from "@/types/api";

export default function TelaNovoTreino() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const criar = useCriarTreino(userId);

  async function salvar(entrada: CreateWorkoutInput): Promise<void> {
    await criar.mutateAsync(entrada);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
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
            <WorkoutForm aoSalvar={salvar} salvando={criar.isPending} />
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
