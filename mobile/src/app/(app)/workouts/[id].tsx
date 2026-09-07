import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { CreateWorkoutInput } from "@/types/api";

export default function TelaEditarTreino() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const parametros = useLocalSearchParams<{ id: string }>();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const consulta = useTreino(parametros.id, autenticado);
  const editar = useEditarTreino();
  const excluir = useExcluirTreino();

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
              <WorkoutForm
                aoSalvar={salvar}
                salvando={editar.isPending || excluir.isPending}
                treino={consulta.data}
              />
              <AppButton
                disabled={editar.isPending || excluir.isPending}
                onPress={confirmarExclusao}
                rotulo={traduzir("treinos.excluir")}
                variante="danger"
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
  estado: { marginTop: 40 },
  formulario: { gap: 16 },
});
