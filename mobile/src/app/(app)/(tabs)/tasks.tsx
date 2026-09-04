import * as Haptics from "expo-haptics";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TaskRow } from "@/components/tasks/task-row";
import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  useAlternarTarefa,
  useCriarTarefa,
  useListaTarefas,
} from "@/features/tasks/hooks";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useTemaApp } from "@/theme/theme";

export default function TelaTarefas() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const [titulo, definirTitulo] = useState("");
  const [erroAcao, definirErroAcao] = useState("");
  const consulta = useListaTarefas();
  const criar = useCriarTarefa();
  const alternar = useAlternarTarefa();
  const tarefas = useMemo(
    () => consulta.data?.content ?? [],
    [consulta.data?.content],
  );
  const { pendentes, concluidas } = useMemo(
    () => ({
      pendentes: tarefas.filter((tarefa) => tarefa.status !== "DONE"),
      concluidas: tarefas.filter((tarefa) => tarefa.status === "DONE"),
    }),
    [tarefas],
  );

  async function criarTarefa(): Promise<void> {
    const tituloLimpo = titulo.trim();
    if (!tituloLimpo || criar.isPending) return;
    definirErroAcao("");
    try {
      await criar.mutateAsync({ title: tituloLimpo });
      definirTitulo("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      definirErroAcao(
        obterMensagemErroApi(erro, traduzir("tarefas.erroCriar"), false),
      );
    }
  }

  function alternarTarefa(id: string): void {
    definirErroAcao("");
    alternar.mutate(id, {
      onError: (erro) =>
        definirErroAcao(
          obterMensagemErroApi(erro, traduzir("tarefas.erroAlternar"), false),
        ),
    });
  }

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      edges={["top", "left", "right"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.tela}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={consulta.isRefetching}
              onRefresh={() => void consulta.refetch()}
              tintColor={tema.cores.marca}
            />
          }
        >
          <ScreenHeader
            titulo={traduzir("tarefas.titulo")}
            subtitulo={traduzir("tarefas.resumo", {
              pendentes: pendentes.length,
              concluidas: concluidas.length,
            })}
          />

          <View
            style={[
              styles.criacao,
              {
                backgroundColor: tema.cores.elevado,
                borderColor: tema.cores.borda,
              },
            ]}
          >
            <Plus color={tema.cores.textoSutil} size={19} />
            <TextInput
              accessibilityLabel={traduzir("tarefas.novaPlaceholder")}
              autoCorrect
              maxLength={200}
              onChangeText={definirTitulo}
              onSubmitEditing={() => void criarTarefa()}
              placeholder={traduzir("tarefas.novaPlaceholder")}
              placeholderTextColor={tema.cores.textoSutil}
              returnKeyType="done"
              selectionColor={tema.cores.marca}
              style={[styles.entrada, { color: tema.cores.texto }]}
              value={titulo}
            />
            {titulo.trim() ? (
              <AppButton
                rotulo={traduzir("tarefas.criar")}
                carregando={criar.isPending}
                onPress={() => void criarTarefa()}
                style={styles.botaoCriar}
              />
            ) : null}
          </View>

          {erroAcao ? (
            <Text
              accessibilityLiveRegion="assertive"
              style={[styles.erro, { color: tema.cores.perigo }]}
            >
              {erroAcao}
            </Text>
          ) : null}

          {consulta.isLoading ? (
            <ActivityIndicator
              color={tema.cores.marca}
              size="large"
              style={styles.carregando}
            />
          ) : consulta.isError ? (
            <FeedbackState
              titulo={traduzir("tarefas.erroTitulo")}
              descricao={traduzir("tarefas.erroDescricao")}
              tipo="erro"
              rotuloAcao={traduzir("comum.tentarNovamente")}
              aoAgir={() => void consulta.refetch()}
            />
          ) : tarefas.length === 0 ? (
            <FeedbackState
              titulo={traduzir("tarefas.vazioTitulo")}
              descricao={traduzir("tarefas.vazioDescricao")}
            />
          ) : (
            <View style={styles.lista}>
              {pendentes.map((tarefa) => (
                <TaskRow
                  key={tarefa.id}
                  tarefa={tarefa}
                  aoAlternar={() => alternarTarefa(tarefa.id)}
                  desabilitada={
                    alternar.isPending && alternar.variables === tarefa.id
                  }
                />
              ))}
              {concluidas.length ? (
                <Text
                  style={[styles.separador, { color: tema.cores.textoSutil }]}
                >
                  {traduzir("tarefas.concluidas")}
                </Text>
              ) : null}
              {concluidas.map((tarefa) => (
                <TaskRow
                  key={tarefa.id}
                  tarefa={tarefa}
                  aoAlternar={() => alternarTarefa(tarefa.id)}
                  desabilitada={
                    alternar.isPending && alternar.variables === tarefa.id
                  }
                />
              ))}
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
    gap: 22,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  criacao: {
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  entrada: { flex: 1, fontSize: 15, paddingVertical: 9 },
  botaoCriar: { minHeight: 40, paddingHorizontal: 14 },
  erro: { fontSize: 13, lineHeight: 19 },
  carregando: { marginTop: 42 },
  lista: { gap: 9 },
  separador: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
    marginTop: 14,
    textTransform: "uppercase",
  },
});
