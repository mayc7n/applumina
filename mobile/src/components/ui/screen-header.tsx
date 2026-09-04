import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";

interface ScreenHeaderProps {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}

export function ScreenHeader({ titulo, subtitulo, acao }: ScreenHeaderProps) {
  const tema = useTemaApp();
  return (
    <View style={styles.container}>
      <View style={styles.textos}>
        <Text
          accessibilityRole="header"
          style={[styles.titulo, { color: tema.cores.texto }]}
        >
          {titulo}
        </Text>
        {subtitulo ? (
          <Text
            style={[styles.subtitulo, { color: tema.cores.textoSecundario }]}
          >
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {acao}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  textos: { flex: 1, gap: 4 },
  titulo: { fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
  subtitulo: { fontSize: 14, lineHeight: 20 },
});
