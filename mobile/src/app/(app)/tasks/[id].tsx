import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskForm } from "@/components/tasks/task-form";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useCriarTarefa, useEditarTarefa, useExcluirTarefa, useTarefa } from "@/features/tasks/hooks";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { CreateTaskInput } from "@/types/api";

export default function TelaEditarTarefa() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const parametros = useLocalSearchParams<{ id: string }>();
  const autenticado = useArmazenamentoAutenticacao((armazenamento) => armazenamento.estado === "autenticado");
  const consulta = useTarefa(parametros.id, autenticado);
  const editar = useEditarTarefa();
  const excluir = useExcluirTarefa();
  const duplicar = useCriarTarefa();

  async function salvar(entrada: CreateTaskInput): Promise<void> {
    await editar.mutateAsync({ id: parametros.id, entrada });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  async function criarCopia(): Promise<void> {
    if (!consulta.data) return;
    try {
      const tarefa = consulta.data;
      await duplicar.mutateAsync({
        title: tarefa.title,
        description: tarefa.description,
        priority: tarefa.priority,
        dueDate: tarefa.dueDate,
        dueTime: tarefa.dueTime?.slice(0, 5),
        scheduledFor: tarefa.scheduledFor,
        estimatedMins: tarefa.estimatedMins,
        projectId: tarefa.projectId,
        labelIds: tarefa.labelIds,
        recurrenceType: tarefa.recurrenceType,
        reminderAt: tarefa.reminderAt,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (erro) {
      Alert.alert(traduzir("tarefas.erroDuplicar"), obterMensagemErroApi(erro, traduzir("comum.erroPadrao"), false));
    }
  }

  function confirmarExclusao(): void {
    Alert.alert(traduzir("tarefas.confirmarExclusaoTitulo"), traduzir("tarefas.confirmarExclusaoDescricao"), [
      { style: "cancel", text: traduzir("tarefas.cancelar") },
      {
        style: "destructive",
        text: traduzir("tarefas.confirmarExclusao"),
        onPress: () => void excluir.mutateAsync(parametros.id).then(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        }).catch((erro) => {
          Alert.alert(traduzir("tarefas.erroExcluir"), obterMensagemErroApi(erro, traduzir("comum.erroPadrao"), false));
        }),
      },
    ]);
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.tela}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            inicio={<Pressable accessibilityLabel={traduzir("autenticacao.voltar")} accessibilityRole="button" hitSlop={4} onPress={() => router.back()} style={({ pressed }) => [styles.voltar, { backgroundColor: pressed ? tema.cores.sobreposicao : "transparent" }]}><ArrowLeft color={tema.cores.texto} size={24} /></Pressable>}
            titulo={traduzir("tarefas.editarTelaTitulo")}
          />
          {!autenticado ? (
            <View style={styles.estado}>
              <FeedbackState aoAgir={() => router.replace("/login")} descricao={traduzir("tarefas.visitanteDescricao")} rotuloAcao={traduzir("comum.entrar")} titulo={traduzir("tarefas.visitanteTitulo")} />
            </View>
          ) : consulta.isLoading ? (
            <ActivityIndicator accessibilityLabel={traduzir("tarefas.carregando")} color={tema.cores.marca} size="large" style={styles.estado} />
          ) : consulta.isError || !consulta.data ? (
            <View style={styles.estado}>
              <FeedbackState aoAgir={() => void consulta.refetch()} descricao={traduzir("tarefas.erroDescricao")} rotuloAcao={traduzir("comum.tentarNovamente")} tipo="erro" titulo={traduzir("tarefas.erroTitulo")} />
            </View>
          ) : (
            <TaskForm
              aoDuplicar={() => void criarCopia()}
              aoExcluir={confirmarExclusao}
              aoSalvar={salvar}
              salvando={editar.isPending || excluir.isPending || duplicar.isPending}
              tarefa={consulta.data}
            />
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
  estado: { marginTop: 40 },
});
