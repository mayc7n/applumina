import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskForm } from "@/components/tasks/task-form";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCriarTarefa } from "@/features/tasks/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { CreateTaskInput } from "@/types/api";

export default function TelaNovaTarefa() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao((armazenamento) => armazenamento.estado === "autenticado");
  const criar = useCriarTarefa();

  async function salvar(entrada: CreateTaskInput): Promise<void> {
    await criar.mutateAsync(entrada);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.tela}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            inicio={<Pressable accessibilityLabel={traduzir("autenticacao.voltar")} accessibilityRole="button" hitSlop={4} onPress={() => router.back()} style={({ pressed }) => [styles.voltar, { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" }]}><ArrowLeft color={tema.cores.texto} size={24} /></Pressable>}
            titulo={traduzir("tarefas.novaTelaTitulo")}
          />
          {autenticado ? (
            <TaskForm aoSalvar={salvar} salvando={criar.isPending} />
          ) : (
            <View style={styles.visitante}>
              <FeedbackState aoAgir={() => router.replace("/login")} descricao={traduzir("tarefas.visitanteDescricao")} rotuloAcao={traduzir("comum.entrar")} titulo={traduzir("tarefas.visitanteTitulo")} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 26, paddingBottom: 40, paddingHorizontal: 20, paddingTop: 16 },
  voltar: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  visitante: { marginTop: 24 },
});
