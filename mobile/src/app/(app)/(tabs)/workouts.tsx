import { router } from "expo-router";
import { Activity, Bike, Dumbbell, Footprints, Plus, Waves } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkoutCalendar } from "@/components/workouts/workout-calendar";
import { WorkoutDaySheet } from "@/components/workouts/workout-day-sheet";
import { AppButton } from "@/components/ui/app-button";
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { construirGradeMensal, formatarDataCalendario, obterIntervaloSemana } from "@/features/workouts/workout-calendar";
import { useCalendarioTreinos } from "@/features/workouts/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { WorkoutCalendarDay, WorkoutType } from "@/types/api";

const tiposSemanaPt = ["D", "S", "T", "Q", "Q", "S", "S"];
const tiposSemanaEn = ["S", "M", "T", "W", "T", "F", "S"];

function deslocarMes(data: Date, quantidade: number): Date {
  return new Date(data.getFullYear(), data.getMonth() + quantidade, 1, 12);
}

export default function TelaTreinos() {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const [mes, definirMes] = useState(() => new Date());
  const [dataSelecionada, definirDataSelecionada] = useState<string | null>(null);
  const autenticado = useArmazenamentoAutenticacao((estado) => estado.estado === "autenticado");
  const userId = useArmazenamentoAutenticacao((estado) => estado.usuario?.id);
  const geracaoSessao = useArmazenamentoAutenticacao((estado) => estado.geracaoSessao);
  const grade = useMemo(() => construirGradeMensal(mes, idioma === "en" ? "en" : "pt-BR"), [idioma, mes]);
  const consulta = useCalendarioTreinos(userId, geracaoSessao, formatarDataCalendario(grade.inicio), formatarDataCalendario(grade.fim));
  const semana = useMemo(() => obterIntervaloSemana(new Date(), idioma === "en" ? "en" : "pt-BR"), [idioma]);
  const consultaSemana = useCalendarioTreinos(userId, geracaoSessao, formatarDataCalendario(semana.inicio), formatarDataCalendario(semana.fim));
  const dias = consulta.data ?? [];
  const porData = new Map(dias.map((dia) => [dia.date, dia]));
  const diaSelecionado: WorkoutCalendarDay | null = dataSelecionada ? porData.get(dataSelecionada) ?? { date: dataSelecionada, workoutCount: 0, totalMinutes: 0, hasMoment: false, workouts: [] } : null;
  const rotulos: Record<WorkoutType, string> = { WALKING: traduzir("treinos.caminhada"), RUNNING: traduzir("treinos.corrida"), STRENGTH: traduzir("treinos.forca"), CYCLING: traduzir("treinos.ciclismo"), SWIMMING: traduzir("treinos.natacao"), MARTIAL_ARTS: traduzir("treinos.artesMarciais"), TEAM_SPORT: traduzir("treinos.esporteColetivo"), YOGA: traduzir("treinos.yoga"), MOBILITY: traduzir("treinos.mobilidade"), PILATES: traduzir("treinos.pilates"), CUSTOM: traduzir("treinos.personalizada") };
  const mesLabel = new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "pt-BR", { month: "long", year: "numeric" }).format(mes);
  const dataHoje = formatarDataCalendario(new Date());
  const diasSemana = consultaSemana.data ?? [];
  const diasTreinados = new Set(diasSemana.filter((dia) => dia.workoutCount > 0).map((dia) => dia.date)).size;
  const minutosSemana = diasSemana.reduce((total, dia) => total + dia.totalMinutes, 0);
  const mensagemSemana = diasTreinados > 0 ? traduzir("treinos.ritmoEmForma") : traduzir("treinos.descansoConta");
  const modalidadesVisitante = [{ Icone: Footprints, texto: traduzir("treinos.modalidadePassos") }, { Icone: Activity, texto: traduzir("treinos.modalidadeForca") }, { Icone: Bike, texto: traduzir("treinos.modalidadeEsportes") }, { Icone: Waves, texto: traduzir("treinos.modalidadeOutras") }];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={autenticado ? <RefreshControl onRefresh={() => void consulta.refetch()} refreshing={consulta.isRefetching} tintColor={tema.cores.marca} /> : undefined}>
        <ScreenHeader subtitulo={autenticado ? traduzir("treinos.subtituloRitmo") : undefined} titulo={autenticado ? traduzir("treinos.seuRitmo") : traduzir("treinos.titulo")} />
        {!autenticado ? <AnimatedEntry><View style={[styles.introducao, { backgroundColor: tema.cores.marcaSuave, borderColor: tema.cores.marcaContorno }]}><View style={[styles.iconeDestaque, { backgroundColor: tema.cores.elevado }]}><Dumbbell color={tema.cores.marca} size={26} /></View><Text style={[styles.titulo, { color: tema.cores.texto }]}>{traduzir("treinos.titulo")}</Text><Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>{traduzir("treinos.visitanteDescricao")}</Text></View><View style={styles.modalidades}>{modalidadesVisitante.map(({ Icone, texto }) => <View key={texto} style={[styles.modalidade, { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda }]}><View style={[styles.iconeModalidade, { backgroundColor: tema.cores.marcaSuave }]}><Icone color={tema.cores.marca} size={21} /></View><Text style={[styles.modalidadeTexto, { color: tema.cores.texto }]}>{texto}</Text></View>)}</View><AppButton onPress={() => router.push("/login")} rotulo={traduzir("comum.entrar")} /></AnimatedEntry> : <>
          <AnimatedEntry><Pressable accessibilityLabel={traduzir("treinos.registrar")} accessibilityRole="button" android_ripple={{ color: "#FFFFFF29" }} onPress={() => router.push("/workouts/new")} style={({ pressed }) => [styles.acaoPrincipal, { backgroundColor: pressed ? tema.cores.marcaPressionada : tema.cores.marca }]}><View style={styles.acaoTexto}><Text style={[styles.acaoTitulo, { color: tema.cores.sobreMarca }]}>{traduzir("treinos.registrar")}</Text><Text style={[styles.acaoDescricao, { color: tema.cores.sobreMarca }]}>{traduzir("treinos.acaoRapidaDescricao")}</Text></View><View style={[styles.acaoIcone, { backgroundColor: tema.cores.sobreMarca }]}><Plus color={tema.cores.marca} size={24} /></View></Pressable></AnimatedEntry>
          <AnimatedEntry><View style={[styles.resumo, { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda }]}><View><Text style={[styles.resumoLabel, { color: tema.cores.textoSecundario }]}>{traduzir("treinos.resumoSemana")}</Text><Text style={[styles.resumoValue, { color: tema.cores.texto }]}>{traduzir("treinos.diasTreinados", { quantidade: diasTreinados })}</Text></View><View style={[styles.minutos, { backgroundColor: tema.cores.marcaSuave }]}><Text style={[styles.minutosValue, { color: tema.cores.marca }]}>{minutosSemana}</Text><Text style={[styles.minutosLabel, { color: tema.cores.marca }]}>{traduzir("treinos.minutosSemana")}</Text></View><Text style={[styles.mensagem, { color: tema.cores.textoSecundario }]}>{mensagemSemana}</Text></View></AnimatedEntry>
          {consulta.isLoading ? <ActivityIndicator color={tema.cores.marca} size="large" style={styles.carregando} /> : consulta.isError ? <FeedbackState aoAgir={() => void consulta.refetch()} descricao={traduzir("treinos.erroDescricao")} rotuloAcao={traduzir("comum.tentarNovamente")} tipo="erro" titulo={traduzir("treinos.erroTitulo")} /> : <WorkoutCalendar dias={dias} diasGrade={grade.dias.map(formatarDataCalendario)} hoje={dataHoje} mesKey={formatarDataCalendario(mes).slice(0, 7)} mesLabel={mesLabel} onAnterior={() => definirMes((atual) => deslocarMes(atual, -1))} onProximo={() => definirMes((atual) => deslocarMes(atual, 1))} onSelecionar={definirDataSelecionada} rotuloMesAnterior={traduzir("treinos.mesAnterior")} rotuloProximoMes={traduzir("treinos.proximoMes")} rotulosSemana={idioma === "en" ? tiposSemanaEn : tiposSemanaPt} />}
          <WorkoutDaySheet dia={diaSelecionado} onAdicionarMomento={(id) => { definirDataSelecionada(null); router.push({ pathname: "/workouts/[id]", params: { id, moment: "1" } }); }} onAbrirTreino={(id) => { definirDataSelecionada(null); router.push({ pathname: "/workouts/[id]", params: { id } }); }} onFechar={() => definirDataSelecionada(null)} onRegistrar={(data) => { definirDataSelecionada(null); router.push({ pathname: "/workouts/new", params: { date: data } }); }} rotuloFechar={traduzir("treinos.fecharDia")} rotuloRegistrar={traduzir("treinos.registrarNestaData")} tituloData={dataSelecionada ? new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "pt-BR", { dateStyle: "full" }).format(new Date(`${dataSelecionada}T12:00:00`)) : ""} rotulos={rotulos} visivel={Boolean(dataSelecionada)} />
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ tela: { flex: 1 }, conteudo: { gap: 22, padding: 20, paddingBottom: 36 }, introducao: { borderRadius: 24, borderWidth: 1, gap: 10, padding: 22 }, iconeDestaque: { alignItems: "center", borderRadius: 25, height: 50, justifyContent: "center", marginBottom: 4, width: 50 }, titulo: { fontSize: 22, fontWeight: "800", lineHeight: 28 }, descricao: { fontSize: 15, lineHeight: 22 }, modalidades: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 16 }, modalidade: { borderRadius: 18, borderWidth: 1, flexBasis: "47%", flexGrow: 1, gap: 12, minHeight: 132, padding: 16 }, iconeModalidade: { alignItems: "center", borderRadius: 20, height: 40, justifyContent: "center", width: 40 }, modalidadeTexto: { fontSize: 14, fontWeight: "600", lineHeight: 20 }, acaoPrincipal: { alignItems: "center", borderRadius: 18, elevation: 1, flexDirection: "row", gap: 14, minHeight: 104, overflow: "hidden", padding: 16, shadowColor: "#2B1712", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, acaoTexto: { flex: 1, gap: 5, zIndex: 1 }, acaoTitulo: { fontSize: 21, fontWeight: "800", lineHeight: 27 }, acaoDescricao: { fontSize: 14, lineHeight: 20, opacity: 0.9 }, acaoIcone: { alignItems: "center", borderRadius: 22, elevation: 1, height: 48, justifyContent: "center", width: 48 }, carregando: { marginTop: 42 }, resumo: { borderRadius: 20, borderWidth: 1, gap: 9, padding: 17 }, resumoLabel: { fontSize: 13, fontWeight: "700" }, resumoValue: { fontSize: 20, fontWeight: "800", marginTop: 3 }, minutos: { alignItems: "center", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, position: "absolute", right: 16, top: 16 }, minutosValue: { fontSize: 20, fontWeight: "800" }, minutosLabel: { fontSize: 11, fontWeight: "700" }, mensagem: { fontSize: 14, lineHeight: 20, paddingRight: 100 } });
