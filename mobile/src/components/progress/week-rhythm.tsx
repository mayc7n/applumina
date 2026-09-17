import { StyleSheet, Text, View } from "react-native";

import type { DiaRitmo } from "@/features/dashboard/home-metrics";
import { useTemaApp } from "@/theme/theme";

interface WeekRhythmProps {
  dias: DiaRitmo[];
  titulo: string;
  descricao: string;
}

export function WeekRhythm({ dias, titulo, descricao }: WeekRhythmProps) {
  const tema = useTemaApp();

  return (
    <View
      accessibilityLabel={titulo}
      accessibilityRole="summary"
      style={styles.container}
    >
      <View style={styles.cabecalho}>
        <Text style={[styles.titulo, { color: tema.cores.texto }]}>
          {titulo}
        </Text>
        <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
          {descricao}
        </Text>
      </View>
      <View style={styles.trilho}>
        {dias.map((dia) => (
          <View
            accessibilityLabel={dia.rotuloAcessibilidade}
            accessibilityRole="text"
            key={dia.id}
            style={[
              styles.dia,
              dia.hoje && {
                borderColor: tema.cores.marca,
                borderWidth: 1,
              },
            ]}
            testID={`week-rhythm-day-${dia.id}`}
          >
            <Text style={[styles.rotuloDia, { color: tema.cores.textoSutil }]}>
              {dia.rotulo}
            </Text>
            <View
              style={[
                styles.marcador,
                {
                  backgroundColor: dia.ativo
                    ? tema.cores.marca
                    : tema.cores.sobreposicao,
                  borderColor: dia.ativo
                    ? tema.cores.marca
                    : tema.cores.borda,
                },
              ]}
              testID={`week-rhythm-marker-${dia.id}`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  cabecalho: { gap: 3 },
  titulo: { fontSize: 17, fontWeight: "800", letterSpacing: -0.25 },
  descricao: { fontSize: 12, lineHeight: 17 },
  trilho: { flexDirection: "row", gap: 6, justifyContent: "space-between" },
  dia: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 7,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 36,
    paddingHorizontal: 2,
    paddingVertical: 7,
  },
  rotuloDia: { fontSize: 11, fontWeight: "700", textTransform: "lowercase" },
  marcador: { borderRadius: 7, borderWidth: 1, height: 14, width: 14 },
});
