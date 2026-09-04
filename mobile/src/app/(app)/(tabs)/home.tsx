import { useQuery } from "@tanstack/react-query";
import { CheckSquare2, Flame, Target, Timer } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MetricCard } from "@/components/dashboard/metric-card";
import { TaskRow } from "@/components/tasks/task-row";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { chavePainel, useAlternarTarefa } from "@/features/tasks/hooks";
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
  const { traduzir } = useIdioma();
  const usuario = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario,
  );
  const consulta = useQuery({
    queryKey: chavePainel,
    queryFn: apiPainel.obter,
  });
  const alternar = useAlternarTarefa();
  const tarefasHoje = consulta.data?.todayTasks ?? [];
  const concluidas = tarefasHoje.filter(
    (tarefa) => tarefa.status === "DONE",
  ).length;

  function alternarTarefa(id: string): void {
    alternar.mutate(id, {
      onError: () => Alert.alert(traduzir("tarefas.erroAlternar")),
    });
  }

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={
          <RefreshControl
            refreshing={consulta.isRefetching}
            onRefresh={() => void consulta.refetch()}
            tintColor={tema.cores.marca}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          titulo={`${obterSaudacao(traduzir)}, ${usuario?.displayName?.split(" ")[0] ?? "Lumina"}`}
          subtitulo={traduzir("inicio.subtitulo")}
        />

        {consulta.isLoading ? (
          <ActivityIndicator
            color={tema.cores.marca}
            size="large"
            style={styles.carregando}
          />
        ) : consulta.isError ? (
          <FeedbackState
            titulo={traduzir("inicio.erroTitulo")}
            descricao={traduzir("inicio.erroDescricao")}
            tipo="erro"
            rotuloAcao={traduzir("comum.tentarNovamente")}
            aoAgir={() => void consulta.refetch()}
          />
        ) : (
          <>
            <View style={styles.metricas}>
              <MetricCard
                Icone={CheckSquare2}
                cor={tema.cores.marca}
                rotulo={traduzir("inicio.tarefasHoje")}
                valor={`${concluidas}/${tarefasHoje.length}`}
              />
              <MetricCard
                Icone={Flame}
                cor="#F97316"
                rotulo={traduzir("inicio.sequencia")}
                valor={traduzir("inicio.dias", {
                  quantidade: consulta.data?.streak ?? 0,
                })}
              />
              <MetricCard
                Icone={Timer}
                cor="#A855F7"
                rotulo={traduzir("inicio.focoSemana")}
                valor={traduzir("inicio.minutos", {
                  quantidade: consulta.data?.focusStats?.weeklyMins ?? 0,
                })}
              />
              <MetricCard
                Icone={Target}
                cor="#7C3AED"
                rotulo={traduzir("inicio.metasAtivas")}
                valor={String(consulta.data?.activeGoals?.length ?? 0)}
              />
            </View>

            <View style={styles.secao}>
              <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                {traduzir("inicio.tarefasTitulo")}
              </Text>
              {tarefasHoje.length ? (
                <View style={styles.lista}>
                  {tarefasHoje.slice(0, 5).map((tarefa) => (
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
              ) : (
                <Text
                  style={[
                    styles.vazio,
                    {
                      color: tema.cores.textoSecundario,
                      borderColor: tema.cores.borda,
                    },
                  ]}
                >
                  {traduzir("inicio.tarefasVazias")}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 26,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  carregando: { marginTop: 70 },
  metricas: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  secao: { gap: 12 },
  tituloSecao: { fontSize: 17, fontWeight: "700" },
  lista: { gap: 9 },
  vazio: {
    borderRadius: 14,
    borderStyle: "dashed",
    borderWidth: 1,
    fontSize: 14,
    padding: 22,
    textAlign: "center",
  },
});
