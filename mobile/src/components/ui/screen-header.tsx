import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AnimatedEntry } from "@/components/ui/animated-entry";
import { useTemaApp } from "@/theme/theme";

interface ScreenHeaderProps {
  titulo: string;
  subtitulo?: string;
  inicio?: ReactNode;
  acao?: ReactNode;
}

export function ScreenHeader({ titulo, subtitulo, inicio, acao }: ScreenHeaderProps) {
  const tema = useTemaApp();
  return (
    <AnimatedEntry>
      <View style={styles.container}>
        {inicio}
        <View style={styles.textos}>
          <View style={styles.linhaTitulo}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[styles.marca, { backgroundColor: tema.cores.marca }]}
            />
            <Text
              accessibilityRole="header"
              style={[styles.titulo, { color: tema.cores.texto }]}
            >
              {titulo}
            </Text>
          </View>
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
    </AnimatedEntry>
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
  linhaTitulo: { alignItems: "center", flexDirection: "row", gap: 10 },
  marca: { borderRadius: 3, height: 24, width: 5 },
  titulo: { flexShrink: 1, fontSize: 26, fontWeight: "800", letterSpacing: -0.6 },
  subtitulo: { fontSize: 14, lineHeight: 20 },
});
