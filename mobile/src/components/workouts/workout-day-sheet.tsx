import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Fragment } from "react";

import { AppButton } from "@/components/ui/app-button";
import { useTemaApp } from "@/theme/theme";
import type { WorkoutCalendarDay, WorkoutType } from "@/types/api";

interface WorkoutDaySheetProps {
  dia: WorkoutCalendarDay | null;
  visivel: boolean;
  tituloData: string;
  rotulos: Record<WorkoutType, string>;
  rotuloRegistrar: string;
  rotuloFechar: string;
  onFechar: () => void;
  onRegistrar: (data: string) => void;
  onAbrirTreino: (id: string) => void;
  onAdicionarMomento: (id: string) => void;
}

export function WorkoutDaySheet({
  dia,
  visivel,
  tituloData,
  rotulos,
  rotuloRegistrar,
  rotuloFechar,
  onFechar,
  onRegistrar,
  onAbrirTreino,
  onAdicionarMomento,
}: WorkoutDaySheetProps) {
  const tema = useTemaApp();
  if (!dia) return null;
  return (
    <Modal animationType="slide" onRequestClose={onFechar} transparent visible={visivel}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel={rotuloFechar} accessibilityRole="button" onPress={onFechar} style={styles.backdrop} />
        <View style={[styles.sheet, { backgroundColor: tema.cores.elevado }]}>
          <View style={[styles.handle, { backgroundColor: tema.cores.bordaForte }]} />
          <Text accessibilityRole="header" style={[styles.title, { color: tema.cores.texto }]}>{tituloData}</Text>
          <Text style={[styles.summary, { color: tema.cores.textoSecundario }]}>{dia.workoutCount} · {dia.totalMinutes} min</Text>
          <ScrollView contentContainerStyle={styles.list}>
            {dia.workouts.map((treino) => (
              <Fragment key={treino.id}>
              <Pressable
                accessibilityLabel={`${rotulos[treino.type]} ${treino.durationMins} minutos`}
                accessibilityRole="button"
                onPress={() => onAbrirTreino(treino.id)}
                style={({ pressed }) => [styles.row, { borderColor: tema.cores.borda, backgroundColor: pressed ? tema.cores.marcaSuave : tema.cores.sobreposicao }]}
              >
                <View style={[styles.dot, { backgroundColor: tema.cores.marca }]} />
                <Text style={[styles.rowTitle, { color: tema.cores.texto }]}>{treino.customActivity || rotulos[treino.type]}</Text>
                <Text style={[styles.rowMinutes, { color: tema.cores.textoSecundario }]}>{treino.durationMins} min</Text>
              </Pressable>
              <Pressable accessibilityLabel="Adicionar momento" accessibilityRole="button" onPress={() => onAdicionarMomento(treino.id)} style={[styles.moment, { borderColor: tema.cores.marca }]}>
                <Text style={[styles.momentText, { color: tema.cores.marca }]}>+ foto</Text>
              </Pressable>
              </Fragment>
            ))}
          </ScrollView>
          <AppButton onPress={() => onRegistrar(dia.date)} rotulo={rotuloRegistrar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "#00000055", flex: 1 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 10, maxHeight: "72%", padding: 20, paddingBottom: 28 },
  handle: { alignSelf: "center", borderRadius: 3, height: 5, marginBottom: 6, width: 42 },
  title: { fontSize: 22, fontWeight: "800" },
  summary: { fontSize: 14 },
  list: { gap: 9, paddingVertical: 8 },
  row: { alignItems: "center", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 56, paddingHorizontal: 14 },
  dot: { borderRadius: 5, height: 9, width: 9 },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: "700" },
  rowMinutes: { fontSize: 13 },
  moment: { alignItems: "center", borderRadius: 12, borderWidth: 1, minHeight: 40, justifyContent: "center", paddingHorizontal: 10 },
  momentText: { fontSize: 12, fontWeight: "800" },
});
