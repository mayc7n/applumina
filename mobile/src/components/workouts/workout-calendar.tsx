import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";
import type { WorkoutCalendarDay } from "@/types/api";

interface WorkoutCalendarProps {
  diasGrade: string[];
  dias: WorkoutCalendarDay[];
  mesKey: string;
  mesLabel: string;
  rotulosSemana: string[];
  hoje: string;
  onAnterior: () => void;
  onProximo: () => void;
  onSelecionar: (data: string) => void;
  rotuloMesAnterior?: string;
  rotuloProximoMes?: string;
}

export function WorkoutCalendar({
  diasGrade,
  dias,
  mesKey,
  mesLabel,
  rotulosSemana,
  hoje,
  onAnterior,
  onProximo,
  onSelecionar,
  rotuloMesAnterior = "Mês anterior",
  rotuloProximoMes = "Próximo mês",
}: WorkoutCalendarProps) {
  const tema = useTemaApp();
  const porData = new Map(dias.map((dia) => [dia.date, dia]));

  return (
    <View style={[styles.container, { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={rotuloMesAnterior}
          accessibilityRole="button"
          hitSlop={6}
          onPress={onAnterior}
          style={({ pressed }) => [styles.nav, { backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao }]}
        >
          <ChevronLeft color={tema.cores.texto} size={20} />
        </Pressable>
        <Text accessibilityRole="header" style={[styles.month, { color: tema.cores.texto }]}>{mesLabel}</Text>
        <Pressable
          accessibilityLabel={rotuloProximoMes}
          accessibilityRole="button"
          hitSlop={6}
          onPress={onProximo}
          style={({ pressed }) => [styles.nav, { backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao }]}
        >
          <ChevronRight color={tema.cores.texto} size={20} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {rotulosSemana.map((rotulo, indice) => <Text key={`${rotulo}-${indice}`} style={[styles.weekday, { color: tema.cores.textoSutil }]}>{rotulo}</Text>)}
      </View>
      <View style={styles.grid}>
        {diasGrade.map((data) => {
          const dia = porData.get(data);
          const dataObj = new Date(`${data}T12:00:00`);
          const numero = dataObj.getDate();
          const doMes = data.slice(0, 7) === mesKey;
          const selecionavel = Boolean(dia?.workoutCount);
          const acessibilidade = `${data}, ${dia?.workoutCount ?? 0} treinos${dia?.hasMoment ? ", com foto" : ""}`;
          return (
            <Pressable
              accessibilityLabel={acessibilidade}
              accessibilityRole="button"
              key={data}
              onPress={() => onSelecionar(data)}
              style={({ pressed }) => [
                styles.day,
                !doMes && styles.dayOutside,
                data === hoje && { borderColor: tema.cores.marca, borderWidth: 1 },
                pressed && { backgroundColor: tema.cores.marcaSuave },
              ]}
            >
              <Text style={[styles.dayNumber, { color: doMes ? tema.cores.texto : tema.cores.textoSutil }]}>{numero}</Text>
              {selecionavel ? <View style={[styles.pulse, { backgroundColor: tema.cores.marca }]} /> : <View style={styles.pulsePlaceholder} />}
              {dia?.hasMoment ? <ImageIcon accessibilityElementsHidden color={tema.cores.marca} size={12} /> : null}
              {dia && dia.workoutCount > 1 ? <Text style={[styles.count, { color: tema.cores.marca }]}>{dia.workoutCount}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 22, borderWidth: 1, gap: 14, padding: 16 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  nav: { alignItems: "center", borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  month: { fontSize: 17, fontWeight: "800", textTransform: "capitalize" },
  weekdays: { flexDirection: "row" },
  weekday: { flex: 1, fontSize: 11, fontWeight: "700", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: { alignItems: "center", borderColor: "transparent", borderRadius: 13, borderWidth: 1, gap: 2, height: 54, justifyContent: "center", width: "14.2857%" },
  dayOutside: { opacity: 0.45 },
  dayNumber: { fontSize: 14, fontWeight: "700" },
  pulse: { borderRadius: 4, height: 5, width: 5 },
  pulsePlaceholder: { height: 5, width: 5 },
  count: { fontSize: 9, fontWeight: "800", position: "absolute", right: 5, top: 4 },
});
