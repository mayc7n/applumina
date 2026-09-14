import { format } from "date-fns";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useAlternarTarefa, useCriarTarefa, useListaTarefas } from "@/features/tasks/hooks";
import { filtrarTarefas, type FiltroTarefa } from "@/features/tasks/task-filters";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import { useReducaoMovimento } from "@/theme/use-reduced-motion";
import type { Task } from "@/types/api";

export default function TelaTarefas() {
  const tema = useTemaApp();
  const reduzirMovimento = useReducaoMovimento();
  const { traduzir } = useIdioma();
  const [titulo, definirTitulo] = useState("");
  const [busca, definirBusca] = useState("");
  const [filtro, definirFiltro] = useState<FiltroTarefa>("TODAY");
  const [erroAcao, definirErroAcao] = useState("");
  const autenticado = useArmazenamentoAutenticacao((armazenamento) => armazenamento.estado === "autenticado");
  const userId = useArmazenamentoAutenticacao((armazenamento) => armazenamento.usuario?.id);
  const consulta = useListaTarefas(userId);
  const criar = useCriarTarefa(userId);
  const alternar = useAlternarTarefa(userId);
  const tarefas = useMemo(
    () => consulta.data?.pages.flatMap((pagina) => pagina.content) ?? [],
    [consulta.data?.pages],
  );
  const totalTarefas = consulta.data?.pages[0]?.totalElements ?? 0;
  const tarefasVisiveis = useMemo(
    () => filtrarTarefas(tarefas, filtro, busca, format(new Date(), "yyyy-MM-dd")),
    [busca, filtro, tarefas],
  );

  if (!autenticado) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
        <View style={styles.conteudoVisitante}>
          <ScreenHeader titulo={traduzir("tarefas.titulo")} />
          <FeedbackState
            aoAgir={() => router.push("/login")}
            descricao={traduzir("tarefas.visitanteDescricao")}
            rotuloAcao={traduzir("comum.entrar")}
            titulo={traduzir("tarefas.visitanteTitulo")}
          />
          <AppButton onPress={() => router.push("/register")} rotulo={traduzir("comum.criarConta")} variante="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  async function criarTarefa(): Promise<void> {
    const tituloLimpo = titulo.trim();
    if (!tituloLimpo || criar.isPending) return;
    definirErroAcao("");
    try {
      await criar.mutateAsync({
        title: tituloLimpo,
        scheduledFor: format(new Date(), "yyyy-MM-dd"),
      });
      definirTitulo("");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      definirErroAcao(obterMensagemErroApi(erro, traduzir("tarefas.erroCriar"), false));
    }
  }

  async function alternarTarefa(tarefa: Task): Promise<void> {
    definirErroAcao("");
    try {
      await alternar.mutateAsync(tarefa.id);
      if (tarefa.status === "DONE") void Haptics.selectionAsync();
      else void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      definirErroAcao(obterMensagemErroApi(erro, traduzir("tarefas.erroAlternar"), false));
    }
  }

  const filtros = [
    ["TODAY", "tarefas.filtroHoje"],
    ["UPCOMING", "tarefas.filtroProximas"],
    ["OVERDUE", "tarefas.filtroAtrasadas"],
    ["DONE", "tarefas.filtroConcluidas"],
    ["ALL", "tarefas.filtroTodas"],
  ] as const;

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: tema.cores.fundo }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.tela}>
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={consulta.isRefetching} onRefresh={() => void consulta.refetch()} tintColor={tema.cores.marca} />}
        >
          <ScreenHeader
            acao={
              <Pressable
                accessibilityLabel={traduzir("tarefas.novaCompleta")}
                accessibilityRole="button"
                hitSlop={4}
                onPress={() => router.push("/tasks/new")}
                style={({ pressed }) => [styles.acaoCabecalho, { backgroundColor: pressed ? tema.cores.marcaContorno : tema.cores.marcaSuave }]}
              >
                <Plus color={tema.cores.marca} size={23} />
              </Pressable>
            }
            subtitulo={traduzir("tarefas.resumoTotal", { total: totalTarefas })}
            titulo={traduzir("tarefas.titulo")}
          />

          <AnimatedEntry>
            <View
              style={[
                styles.ferramentas,
                {
                  backgroundColor: tema.cores.elevado,
                  borderColor: tema.cores.borda,
                },
              ]}
            >
              <View
                style={[
                  styles.busca,
                  {
                    borderColor: tema.cores.borda,
                    backgroundColor: tema.cores.sobreposicao,
                  },
                ]}
              >
                <Search color={tema.cores.textoSutil} size={19} />
                <TextInput
                  accessibilityLabel={traduzir("tarefas.buscar")}
                  autoCorrect
                  onChangeText={definirBusca}
                  placeholder={traduzir("tarefas.buscar")}
                  placeholderTextColor={tema.cores.textoSutil}
                  returnKeyType="search"
                  selectionColor={tema.cores.marca}
                  style={[styles.entrada, { color: tema.cores.texto }]}
                  value={busca}
                />
              </View>

              <ScrollView
                accessibilityLabel={traduzir("tarefas.filtros")}
                accessibilityRole="radiogroup"
                horizontal
                contentContainerStyle={styles.filtros}
                showsHorizontalScrollIndicator={false}
              >
                {filtros.map(([valor, chave]) => {
                  const selecionado = filtro === valor;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: selecionado }}
                      android_ripple={{
                        color: selecionado
                          ? "#FFFFFF33"
                          : tema.cores.marcaContorno,
                      }}
                      key={valor}
                      onPress={() => definirFiltro(valor)}
                      style={({ pressed }) => [
                        styles.filtro,
                        {
                          backgroundColor: selecionado
                            ? tema.cores.marca
                            : tema.cores.sobreposicao,
                          elevation: selecionado ? 3 : 0,
                          shadowColor: tema.cores.marca,
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: selecionado ? 0.22 : 0,
                          shadowRadius: 7,
                          transform: [{ scale: pressed && reduzirMovimento === false ? 0.96 : 1 }],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filtroTexto,
                          {
                            color: selecionado
                              ? tema.cores.sobreMarca
                              : tema.cores.textoSecundario,
                          },
                        ]}
                      >
                        {traduzir(chave)}
                      </Text>
                      {selecionado ? (
                        <Check color={tema.cores.sobreMarca} size={14} strokeWidth={3} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </AnimatedEntry>

          {erroAcao ? <Text accessibilityLiveRegion="assertive" style={[styles.erro, { color: tema.cores.perigo }]}>{erroAcao}</Text> : null}

          {consulta.isLoading ? (
            <ActivityIndicator color={tema.cores.marca} size="large" style={styles.carregando} />
          ) : consulta.isError ? (
            <FeedbackState aoAgir={() => void consulta.refetch()} descricao={traduzir("tarefas.erroDescricao")} rotuloAcao={traduzir("comum.tentarNovamente")} tipo="erro" titulo={traduzir("tarefas.erroTitulo")} />
          ) : tarefas.length === 0 ? (
            <FeedbackState aoAgir={() => router.push("/tasks/new")} descricao={traduzir("tarefas.vazioDescricao")} rotuloAcao={traduzir("tarefas.criarTarefa")} titulo={traduzir("tarefas.vazioTitulo")} />
          ) : tarefasVisiveis.length === 0 ? (
            <FeedbackState descricao={traduzir("tarefas.semResultadoDescricao")} titulo={traduzir("tarefas.semResultadoTitulo")} />
          ) : (
            <View style={styles.lista}>
              {tarefasVisiveis.map((tarefa, indice) => (
                <AnimatedEntry atraso={Math.min(indice, 6) * 35} key={tarefa.id}>
                  <TaskRow
                    aoAlternar={() => void alternarTarefa(tarefa)}
                    aoEditar={() => router.push({ pathname: "/tasks/[id]", params: { id: tarefa.id } })}
                    desabilitada={alternar.isPending && alternar.variables === tarefa.id}
                    tarefa={tarefa}
                  />
                </AnimatedEntry>
              ))}
              {consulta.hasNextPage ? (
                <AppButton
                  carregando={consulta.isFetchingNextPage}
                  onPress={() => void consulta.fetchNextPage()}
                  rotulo={traduzir("tarefas.carregarMais")}
                  style={styles.carregarMais}
                  variante="secondary"
                />
              ) : null}
            </View>
          )}
        </ScrollView>
        <AnimatedEntry
          style={[
            styles.dockCaptura,
            {
              backgroundColor: tema.cores.elevado,
              borderColor: tema.cores.marcaContorno,
            },
          ]}
        >
          <View style={[styles.criacaoIcone, { backgroundColor: tema.cores.marcaSuave }]}>
            <Plus color={tema.cores.marca} size={20} />
          </View>
          <TextInput
            accessibilityLabel={traduzir("tarefas.novaPlaceholder")}
            autoCorrect
            maxLength={500}
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
              carregando={criar.isPending}
              onPress={() => void criarTarefa()}
              rotulo={traduzir("tarefas.criar")}
              style={styles.botaoCriar}
            />
          ) : null}
        </AnimatedEntry>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 18, paddingBottom: 18, paddingHorizontal: 20, paddingTop: 18 },
  conteudoVisitante: { flex: 1, gap: 22, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 18 },
  acaoCabecalho: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  criacaoIcone: { alignItems: "center", borderRadius: 17, height: 42, justifyContent: "center", width: 42 },
  dockCaptura: { alignItems: "center", borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 8, minHeight: 66, paddingHorizontal: 10, paddingVertical: 8, shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 18 },
  ferramentas: { borderRadius: 22, borderWidth: 1, gap: 12, padding: 12 },
  busca: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 50, paddingHorizontal: 14 },
  entrada: { flex: 1, fontSize: 16, paddingVertical: 9 },
  botaoCriar: { minHeight: 44, paddingHorizontal: 14 },
  filtros: { gap: 8, paddingRight: 4 },
  filtro: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 42, overflow: "hidden", paddingHorizontal: 15 },
  filtroTexto: { fontSize: 13, fontWeight: "700" },
  erro: { fontSize: 13, lineHeight: 19 },
  carregando: { marginTop: 42 },
  lista: { gap: 10, marginTop: 2 },
  carregarMais: { marginTop: 14 },
});
