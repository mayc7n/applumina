import { CalendarDays, ChevronRight, Clock3 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";
import type { Workout } from "@/types/api";

interface WorkoutRowProps {
  treino: Workout;
  rotuloTipo: string;
  idioma: string;
  rotuloMinutos: string;
  rotuloEditar: string;
  aoEditar: () => void;
}

export function WorkoutRow({
  treino,
  rotuloTipo,
  idioma,
  rotuloMinutos,
  rotuloEditar,
  aoEditar,
}: WorkoutRowProps) {
  const tema = useTemaApp();
  const data = new Intl.DateTimeFormat(idioma, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${treino.activityDate}T12:00:00`));

  return (
    <Pressable
      accessibilityLabel={rotuloEditar}
      accessibilityRole="button"
      onPress={aoEditar}
      style={({ pressed }) => [
        styles.linha,
        { borderColor: tema.cores.borda, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: tema.cores.marcaSuave }]}>
        <Clock3 color={tema.cores.marca} size={21} />
      </View>
      <View style={styles.conteudo}>
        <Text style={[styles.titulo, { color: tema.cores.texto }]}>
          {treino.customActivity || rotuloTipo}
        </Text>
        <View style={styles.metadados}>
          <CalendarDays color={tema.cores.textoSutil} size={15} />
          <Text style={[styles.detalhe, { color: tema.cores.textoSecundario }]}>
            {data} · {rotuloMinutos}
          </Text>
        </View>
        {treino.notes ? (
          <Text
            numberOfLines={2}
            style={[styles.observacoes, { color: tema.cores.textoSecundario }]}
          >
            {treino.notes}
          </Text>
        ) : null}
      </View>
      <ChevronRight color={tema.cores.textoSutil} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
  },
  icone: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  conteudo: { flex: 1, gap: 6 },
  titulo: { fontSize: 16, fontWeight: "700", lineHeight: 21 },
  metadados: { alignItems: "center", flexDirection: "row", gap: 6 },
  detalhe: { fontSize: 13, lineHeight: 18 },
  observacoes: { fontSize: 14, lineHeight: 20 },
});
